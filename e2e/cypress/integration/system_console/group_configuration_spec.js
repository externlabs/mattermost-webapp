// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// - Use element ID when selecting an element. Create one if none.
// ***************************************************************

// Group: @system_console

import * as TIMEOUTS from '../../fixtures/timeouts';

function teamOrChannelIsPresent(name) {
    cy.get('.group-teams-and-channels--body', {timeout: TIMEOUTS.ONE_MIN}).should('be.visible').within(() => {
        cy.findByText(name).should('be.visible');
    });
}

function addGroupSyncable(type, callback) {
    cy.get('#add_team_or_channel').should('be.visible').click();
    cy.get('.dropdown-menu').find(`#add_${type}`).should('be.visible').click();
    cy.get(`.${type}-selector-modal`).should('be.visible');
    cy.get('#multiSelectList').find('.more-modal__row').find(type === 'channel' ? '.channel-name' : '.title').then(($elements) => {
        const name = $elements[0].innerText;

        cy.get('#multiSelectList').find('.more-modal__row').first().click();
        cy.get('#saveItems').click();

        // * Check that the team or channel was added to the view
        teamOrChannelIsPresent(name);

        callback(name);
    });
}

function changeRole(teamOrChannel, newRole) {
    cy.findByTestId(`${teamOrChannel}_current_role`).click();
    cy.get('.Menu__content').should('be.visible').findByText(newRole).click();
}

function savePage() {
    cy.get('#saveSetting').click();
    cy.wait(TIMEOUTS.TWO_SEC); // eslint-disable-line cypress/no-unnecessary-waiting
}

function removeAndConfirm(name) {
    cy.findByTestId(`${name}_groupsyncable_remove`).click();
    cy.get('#confirmModalButton').should('be.visible').click();
    cy.findByText('No teams or channels specified yet').should('be.visible');
}

describe('group configuration', () => {
    let groupID;
    let testTeam;
    let testChannel;

    before(() => {
        cy.requireLicenseForFeature('LDAP');

        cy.apiInitSetup({teamPrefix: {name: 'aaa-test', displayName: 'AAA Test'}}).then(({team, channel}) => {
            testTeam = team;
            testChannel = channel;
        });
    });

    beforeEach(() => {
        // # Link a group
        cy.apiGetLDAPGroups().then((result) => {
            cy.apiLinkGroup(result.body.groups[0].primary_key).then((response) => {
                groupID = response.body.id;

                // # Go to the group configuration view of the linked group
                cy.visit(`/admin_console/user_management/groups/${groupID}`);
                cy.get('#adminConsoleWrapper', {timeout: TIMEOUTS.ONE_MIN}).should('be.visible').
                    find('.admin-console__header').should('have.text', 'Group Configuration');

                // * Check that it has no associated teams or channels
                cy.findByText('No teams or channels specified yet', {timeout: TIMEOUTS.ONE_MIN}).should('be.visible');
            });
        });
    });

    afterEach(() => {
        cy.apiGetGroupTeams(groupID).then((response) => {
            response.body.forEach((item) => {
                cy.apiUnlinkGroupTeam(groupID, item.team_id);
            });
        });
        cy.apiGetGroupChannels(groupID).then((response) => {
            response.body.forEach((item) => {
                cy.apiUnlinkGroupChannel(groupID, item.channel_id);
            });
        });
    });

    describe('adding a team', () => {
        it('does not add a team without saving', () => {
            addGroupSyncable('team', () => {
                // # Click away
                cy.get('.sidebar-section').first().click();

                // * Ensure that discard warning appears
                cy.get('.discard-changes-modal').should('be.visible');

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Check that the team that was added dissappears
                cy.findByText('No teams or channels specified yet').should('be.visible');
            });
        });

        it('does add a team when saved', () => {
            addGroupSyncable('team', (teamName) => {
                // # Save the settings
                savePage();

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Test that the team persisted
                teamOrChannelIsPresent(teamName);

                // * Ensure that server error is blank
                cy.get('.error-message').should('be.empty');
            });
        });
    });

    describe('adding a channel', () => {
        it('shows default channels', () => {
            // # Search for off-topic
            cy.get('#add_team_or_channel').should('be.visible').click();
            cy.get('.dropdown-menu').find('#add_channel').should('be.visible').click();
            cy.get('#selectItems').type('off-');

            // * Check that the off-topic channels are displayed
            cy.get('.more-modal__details').should('have.length.greaterThan', 1);
            cy.findByText(`(${testTeam.display_name})`).should('exist');
        });

        it('does not add a channel without saving', () => {
            addGroupSyncable('channel', () => {
                // # Click away
                cy.get('.sidebar-section').first().click();

                // * Ensure that discard warning appears
                cy.get('.discard-changes-modal').should('be.visible');

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Check that the channel that was added dissappears
                cy.findByText('No teams or channels specified yet').should('be.visible');
            });
        });

        it('does add a channel when saved', () => {
            addGroupSyncable('channel', (channelName) => {
                // # Save the settings
                savePage();

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Test that the team persisted
                teamOrChannelIsPresent(channelName);

                // * Ensure that server error is blank
                cy.get('.error-message').should('be.empty');
            });
        });
    });

    describe('removing a team', () => {
        it('does not remove a team without saving', () => {
            cy.apiGetTeamsForUser().then(({teams}) => {
                // # Link a team
                const team = teams[0];
                cy.apiLinkGroupTeam(groupID, team.id);

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Check that the team was added to the view
                teamOrChannelIsPresent(team.display_name);

                // # Click remove and confirm
                removeAndConfirm(team.display_name);

                // # Click away
                cy.get('.sidebar-section').first().click();

                // * Ensure that discard warning appears
                cy.get('.discard-changes-modal').should('be.visible');

                // # Cancel navigating away
                cy.get('#cancelModalButton').click();

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Check that the team is still visible
                teamOrChannelIsPresent(team.display_name);
            });
        });

        it('does remove a team when saved', () => {
            cy.apiGetTeamsForUser().then(({teams}) => {
                // # Link a team
                const team = teams[0];
                cy.apiLinkGroupTeam(groupID, team.id);

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Check that the team was added to the view
                teamOrChannelIsPresent(team.display_name);

                // # Click remove and confirm
                removeAndConfirm(team.display_name);

                // # Click away
                cy.get('.sidebar-section').first().click();

                // * Ensure that discard warning appears
                cy.get('.discard-changes-modal').should('be.visible');

                // # Cancel navigating away
                cy.get('#cancelModalButton').click();

                // # Save the settings
                savePage();

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Check that the team is no longer present
                cy.findByText('No teams or channels specified yet').should('be.visible');
            });
        });
    });

    describe('removing a channel', () => {
        it('does not remove a channel without saving', () => {
            // # Link a channel
            cy.apiLinkGroupChannel(groupID, testChannel.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the channel was added to the view
            teamOrChannelIsPresent(testChannel.display_name);

            // # Click remove
            cy.findByTestId(`${testChannel.display_name}_groupsyncable_remove`).click();
            cy.get('#confirmModalButton').should('be.visible').click();

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the team is still visible
            teamOrChannelIsPresent(testChannel.display_name);
        });

        it('does remove a channel when saved', () => {
            // # Link a channel
            cy.apiLinkGroupChannel(groupID, testChannel.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the channel was added to the view
            teamOrChannelIsPresent(testChannel.display_name);
            cy.get('.group-teams-and-channels-row', {timeout: TIMEOUTS.ONE_MIN}).should('have.length', 2);

            // # Click remove
            cy.findByTestId(`${testChannel.display_name}_groupsyncable_remove`).click();
            cy.get('#confirmModalButton').should('be.visible').click();

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Save the settings
            savePage();

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the channel is no longer present
            cy.get('.group-teams-and-channels-row', {timeout: TIMEOUTS.ONE_MIN}).should('have.length', 1);
        });
    });

    describe('updating a team role', () => {
        it('updates the role for a new team', () => {
            // # Add a new team
            addGroupSyncable('team', (teamName) => {
                // # Update the role
                const newRole = 'Team Admin';
                changeRole(teamName, newRole);

                // # Click away
                cy.get('.sidebar-section').first().click();

                // * Ensure that discard warning appears
                cy.get('.discard-changes-modal').should('be.visible');

                // # Cancel navigating away
                cy.get('#cancelModalButton').click();

                // # Save the settings
                savePage();

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Ensure the new role is visible
                cy.findByTestId(`${teamName}_current_role`).findByText(newRole);
            });
        });

        it('updates the role for an existing team', () => {
            // # Link a team
            cy.apiLinkGroupTeam(groupID, testTeam.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the team was added to the view
            teamOrChannelIsPresent(testTeam.display_name);

            // # Change the role
            const newRole = 'Team Admin';
            changeRole(testTeam.display_name, newRole);

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Save settings
            savePage();

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Ensure the new role is visible
            cy.findByTestId(`${testTeam.display_name}_current_role`).findByText(newRole);
        });

        it('does not update the role if not saved', () => {
            // # Link a team
            cy.apiLinkGroupTeam(groupID, testTeam.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the team was added to the view
            teamOrChannelIsPresent(testTeam.display_name);

            // # Change the role
            changeRole(testTeam.display_name, 'Team Admin');

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Ensure the new role is visible
            cy.findByTestId(`${testTeam.display_name}_current_role`).findByText('Member');
        });

        it('does not update the role of a removed team', () => {
            // # Link a team
            cy.apiLinkGroupTeam(groupID, testTeam.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the team was added to the view
            teamOrChannelIsPresent(testTeam.display_name);

            // # Change the role
            changeRole(testTeam.display_name, 'Team Admin');

            removeAndConfirm(testTeam.display_name);

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Save settings
            savePage();

            // * Check the groupteam via the API to ensure its role wasn't updated
            cy.apiGetGroupTeam(groupID, testTeam.id).then(({body}) => {
                expect(body.scheme_admin).to.eq(false);
            });
        });
    });

    describe('updating a channel role', () => {
        it('updates the role for a new channel', () => {
            // # Add a new channel
            addGroupSyncable('channel', (channelName) => {
                // # Update the role
                const newRole = 'Channel Admin';
                changeRole(channelName, newRole);

                // # Click away
                cy.get('.sidebar-section').first().click();

                // * Ensure that discard warning appears
                cy.get('.discard-changes-modal').should('be.visible');

                // # Cancel navigating away
                cy.get('#cancelModalButton').click();

                // # Save the settings
                savePage();

                // # Reload the page
                cy.visit(`/admin_console/user_management/groups/${groupID}`);

                // * Ensure the new role is visible
                cy.findByTestId(`${channelName}_current_role`).findByText(newRole);
            });
        });

        it('updates the role for an existing channel', () => {
            // # Link a channel
            cy.apiLinkGroupChannel(groupID, testChannel.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the channel was added to the view
            teamOrChannelIsPresent(testChannel.display_name);

            // # Change the role
            const newRole = 'Channel Admin';
            changeRole(testChannel.display_name, newRole);

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Save settings
            savePage();

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Ensure the new role is visible
            cy.findByTestId(`${testChannel.display_name}_current_role`).findByText(newRole);
        });

        it('does not update the role if not saved', () => {
            // # Link a channel
            cy.apiLinkGroupChannel(groupID, testChannel.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the channel was added to the view
            teamOrChannelIsPresent(testChannel.display_name);

            // # Change the role
            changeRole(testChannel.display_name, 'Channel Admin');

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Ensure the new role is visible
            cy.findByTestId(`${testChannel.display_name}_current_role`).findByText('Member');
        });

        it('does not update the role of a removed channel', () => {
            // # Link a channel
            cy.apiLinkGroupChannel(groupID, testChannel.id);

            // # Reload the page
            cy.visit(`/admin_console/user_management/groups/${groupID}`);

            // * Check that the channel was added to the view
            teamOrChannelIsPresent(testChannel.display_name);

            // # Change the role
            changeRole(testChannel.display_name, 'Channel Admin');

            cy.findByTestId(`${testChannel.display_name}_groupsyncable_remove`).click();
            cy.get('#confirmModalButton').should('be.visible').click();

            // # Click away
            cy.get('.sidebar-section').first().click();

            // * Ensure that discard warning appears
            cy.get('.discard-changes-modal').should('be.visible');

            // # Cancel navigating away
            cy.get('#cancelModalButton').click();

            // # Save settings
            savePage();

            // * Check the groupteam via the API to ensure its role wasn't updated
            cy.apiGetGroupChannel(groupID, testChannel.id).then(({body}) => {
                expect(body.scheme_admin).to.eq(false);
            });
        });
    });
});
