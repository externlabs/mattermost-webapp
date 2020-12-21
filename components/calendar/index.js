import React, { PureComponent } from 'react';
import {connect } from 'react-redux';
import 'components/calendar/calendar.scss';
import LegacySidebar from 'components/legacy_sidebar';
import Scrollbars from 'react-custom-scrollbars';
import ChannelInviteModal from 'components/channel_invite_modal';
import TextBox from 'components/textbox/textbox';
import MultiSelect from 'components/multiselect/multiselect';
import {Modal} from 'react-bootstrap';
import ProfilePicture from 'components/profile_picture';
import GuestBadge from 'components/widgets/badges/guest_badge';
import BotBadge from 'components/widgets/badges/bot_badge';
import {Client4} from 'mattermost-redux/client';
import {displayEntireNameForUser, localizeMessage, isGuest} from 'utils/utils.jsx';
import AddIcon from 'components/widgets/icons/fa_add_icon';
import Constants from 'utils/constants';
import {loadProfilesAndReloadTeamMembers, loadProfilesWithoutTeam } from '../../actions/user_actions';
import { stat } from 'fs';
import { getNonBotUsers } from '../../components/admin_console/system_users/list/selectors';
import {t} from 'utils/i18n.jsx';

const USERS_PER_PAGE = 20;
const MAX_SELECTABLE_VALUES = 10;

class Calendar extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      date: new Date(),
      current_month: new Date().getMonth() + 1,
      current_year: new Date().getFullYear(),
      NumberOfDays: 0,
      Month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      Year: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
      week: ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'],
      responsedata: [],
      eventdate: 0,
      allEvents: [],
      setdate: 0,
      showdate: 0,
      title: null,
      description: null,
      // for_month: false,
      // for_year: false,
      deleteEvent: null,
      _tooltip: false,
      index: 1,
      showModal: false,
      eventflag: 0,
      eventID: '',
      deleteflag: 0,
      reminders: [],
      selectedvalue: false,
      shareModal:false,
      loadingUsers: false,
      saving: false,
      values:[],
      current_event: null,
      users: []
    }
    this.addEventDate = [];
    this.addReminderDate = [];
    this.isModal = false;
    this.shareflag = false;
  }

  fetchUser = async () => {
    console.log(Client4)
    const requests = Client4.getToken();
    return await Promise.resolve(requests);
  } 
  componentDidMount() {
    console.log("document.cookie 5bmr4743ytdqjpuq5d3at41qhc document.cookie",document.cookie.split(" "));
    console.log('Hello', t('login_mfa.token'))
    console.log(this.fetchUser())
    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;
    this.daysInMonth(year, month);
    this.getAllEvents();
    const url = new URL('/api/v4/users?page=0&per_page=1000');
    var user_id = this.getCookie('MMUSERID');
    fetch(url, {
      method: 'GET',
      headers: {
        // Authorization: 'Bearer ' + 'di46ko6nt7n6zkcpnimix37f6a',
        Authorization: 'Bearer ' + 'di46ko6nt7n6zkcpn',
      },

    }).then((response) => response.json())
      .then((result) => {
        console.log('result---',result)
        this.setState({
          users: result.filter(item=> item.id != user_id)
        })
      })
      .catch((err) => { console.log('error', err) })
    
    // await loadProfilesAndReloadTeamMembers(1,10, this.props.teamID).then((result)=>{
    //   console.log("checkm firnm,df result", result);
    // })
    // let check = await loadProfilesWithoutTeam(1, 10, {})
    // console.log("check", check);
    // setTimeout(()=>{
    //   console.log("this.props.profile", this.props)
    // }, 5000)

  }

  getCookie = (cname) => {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    console.log('decodedCookie', decodedCookie)
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  }

  getAllEvents = () => {
    const url = new URL('/api/v4/events');
    fetch(url, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
      },

    }).then((response) => response.json())
      .then((result) => {
        this.setState({
          responsedata: result,
        })
        console.log('getEvent', this.state.responsedata)

      })
      .catch((err) => { console.log('error', err) })
  }

  postEvent = async () => {
    const url = '/api/v4/events';
    this.setState({ showModal: !this.state.showModal });
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'text/plain;charset=utf-8',
        "X-CSRF-Token": document.cookie.split("MMCSRF=")[1]
      },
      body: JSON.stringify({
        date: (`${this.state.setdate}`),
        title: this.state.title,
        description: this.state.description,
      })
    })

    let result = await response.json()
    this.setState({
      title: '',
      description: '',
      showdate: ''
    })
    this.getAllEvents();
  }

  inputTitle = (event) => {
    this.setState({
      title: event.target.value
    })
    console.log(this.state.title)
  }

  inputDate = (event) => {
    let Changedate = event.target.value.split("-").join("")
    let d = Changedate.substr(-2)
    let m = Changedate.substr(4, 2)
    let y = Changedate.substr(0, 4)
    let c = d + m + y;
    this.setState({
      showdate: event.target.value,
      setdate: parseInt(c)

    })
    console.log(this.state.setdate)

  }

  inputDescription = (event) => {
    this.setState({
      description: event.target.value
    })
    console.log(this.state.description)

  }

  daysInMonth = (year, month) => {
    let a = new Date(year, month, 0).getDate()
    let b = new Date(year, month - 1).getDay()
    this.setState({ NumberOfDays: a, }, () => {
    })
  }

  openModel = (id = 0, date = 0, flag = 0) => {
    this.isModal = false
    this.setState({
      showModal: true,
      eventflag: flag,
      eventID: id,
      deleteflag: flag
    }, () => { console.log(this.state.eventflag) })
  }

  shareEvent = (id) => {

    this.isModal = true;
    this.shareflag = true;
    this.setState({
       showEventModal: true,
       current_event: id
     })
  }

  _getMonth = (event) => {
    console.log('event', event.target.value);
    this.setState({
      current_month: event.target.value,
      // for_month: true
    }, () => {
      this.daysInMonth(this.state.current_year, this.state.current_month);
    })
  }
  _prevMonth = () => {
    if(this.state.current_month == 1){
      this.setState({
        current_month: 12,
        current_year: this.state.current_year -1
      }, () => {
        this.daysInMonth(this.state.current_year, this.state.current_month);
      })
    }
    else {
      this.setState({
        current_month: this.state.current_month - 1,
      }, () => {
        this.daysInMonth(this.state.current_year, this.state.current_month);
      })
    }
  }

  _nextMonth = () => {
    if(this.state.current_month == 12){
      this.setState({
        current_month: 1,
        current_year: this.state.current_year + 1
      }, () => {
        this.daysInMonth(this.state.current_year, this.state.current_month);
      })
    }
    else {
      this.setState({
        current_month: this.state.current_month + 1,
      }, () => {
        this.daysInMonth(this.state.current_year, this.state.current_month);
      })
    }
  }

  getYear = (event) => {
    this.setState({
      current_year: event.target.value,
      // for_year: true
    }, () => {
      this.daysInMonth(this.state.current_year, this.state.current_month)
    })

  }

  filterdate = () => {
    this.addEventDate = [];

    this.state.responsedata && this.state.responsedata.length && this.state.responsedata.map(e => {
      if (e.date && e.date.toString().length == 7) {
        var d = parseInt(e.date.toString().substr(0, 1));
        var m = parseInt(e.date.toString().substr(1, 2));
        var y = parseInt(e.date.toString().substr(-4));

        this.compareEventDate(d, m, y, e)

      }
      else {
        var d = parseInt(e.date.toString().substr(0, 2));
        var m = parseInt(e.date.toString().substr(2, 2));
        var y = parseInt(e.date.toString().substr(-4));
        this.compareEventDate(d, m, y, e)
      }
    })

  }

  compareEventDate = (date, month, year, eventObject) => {
    if (year == this.state.current_year && month == this.state.current_month) {
      this.addEventDate.push({ ...eventObject, onlydate: date })
    }

  }

  _tooltip = (event) => {
    this.setState({
      _tooltip: true,
      index: event.target.id,
    }, () => { console.log('dfty', this.state._tooltip) })
  }

  close = () => {
    this.setState({ _tooltip: false })
    if (this.shareflag)
      this.isModal = true;
  }

  confirm = (id) => {
    if (confirm("Do you want to delete event")) {
      this.deleteEvent(id);
    }
    else {
      return;
    }
  }

  renderValue(props) {
      return props.data.username;
  }

  renderOption = (option, isSelected, onAdd, onMouseMove) => {
    var rowSelected = '';
    if (isSelected) {
        rowSelected = 'more-modal__row--selected';
    }

      return (
          <div
              key={option.id}
              ref={isSelected ? 'selected' : option.id}
              className={'more-modal__row clickable ' + rowSelected}
              onClick={() => onAdd(option)}
              onMouseMove={() => onMouseMove(option)}
          >
              <ProfilePicture
                  src={Client4.getProfilePictureUrl(option.id, option.last_picture_update)}
                  size='md'
              />
              <div className='more-modal__details'>
                  <div className='more-modal__name'>
                      {displayEntireNameForUser(option)}
                      <BotBadge
                          show={Boolean(option.is_bot)}
                          className='badge-popoverlist'
                      />
                      <GuestBadge
                          show={isGuest(option)}
                          className='popoverlist'
                      />
                  </div>
              </div>
              <div className='more-modal__actions'>
                  <div className='more-modal__actions--round'>
                      <AddIcon/>
                  </div>
              </div>
          </div>
      );
  };

  deleteEvent = (id) => {
    let url = new URL(`/api/v4/events/${id}`);
    fetch(url, {
      method: 'DELETE',
      headers: {
        accept: '*/*',
        'Content-Type': 'text/plain;charset=utf-8',
        "X-CSRF-Token": document.cookie.split("MMCSRF=")[1],
        Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
      },

    }).then((response) => {
      this.getAllEvents();
    })
      .catch((err) => { console.log('error--', err) })
  }

  updateEvent = (id) => {
    this.setState({ eventflag: false })
    
    let url = new URL(`/api/v4/events/${id}`);
    fetch(url, {
      method: 'PUT',
      headers: {
        accept: '*/*',
        'Content-Type': 'text/plain;charset=utf-8',
        "X-CSRF-Token": document.cookie.split("MMCSRF=")[1],
        Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
      },
      body: JSON.stringify({
        title: this.state.title,
        date: (`${this.state.setdate}`),
        description: this.state.description
      })
    }).then((response) => {
      this.setState({
        showModal: false,
        title: '',
        description: '',
        showdate: ''

      })
      this.getAllEvents();
    })
      .catch((err) => {
        console.log(err)
      })

  }

  setUsersLoadingState = (loadingState) => {
      this.setState({
          loadingUsers: loadingState,
      });
  };

  handlePageChange = (page, prevPage) => {
      if (page > prevPage) {
          this.setUsersLoadingState(true);
          this.props.actions.getProfilesNotInChannel(
            "",//this.props.channel.team_id, 
            "",//this.props.channel.id, 
            "",//this.props.channel.group_constrained, 
            page + 1, USERS_PER_PAGE).then((response) => {
              console.log('response', response);
              this.setUsersLoadingState(false);
          });
      }
  };

  search = (searchTerm) => {
      const term = searchTerm.trim();
      clearTimeout(this.searchTimeoutId);
      this.setState({
          term,
      });

      this.searchTimeoutId = setTimeout(
          async () => {
              if (!term) {
                  return;
              }

              this.setUsersLoadingState(true);
              const options = {
                  team_id: this.props.channel.team_id,
                  not_in_channel_id: this.props.channel.id,
                  group_constrained: this.props.channel.group_constrained,
              };
              await this.props.actions.searchProfiles(term, options);
              this.setUsersLoadingState(false);
          },
          Constants.SEARCH_TIMEOUT_MILLISECONDS,
      );
  };

  handleDelete = (values) => {
      this.setState({values});
  };

  addValue = (value) => {
    console.log('Values', value)
      const values = Object.assign([], this.state.values);
      if (values.indexOf(value) === -1) {
          values.push(value);
      }

      this.setState({values});
  };

  handleSubmit = async (e) => {
    var user_Id = this.state.values.map((value, index) => {
      return value.id
    })
    const url = '/api/v4/eventshare';
    
    let response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'Content-Type': 'text/plain;charset=utf-8',
        "X-CSRF-Token": document.cookie.split("MMCSRF=")[1]
      },
      body: JSON.stringify({
        user_Id: user_Id,
        EventId: this.state.current_event,
      })
    })

    let result = await response.json()
    if(result.create_at){
      this.setState({
        showEventModal: false
      })
    }
    // const {actions, channel} = this.props;
    // if (e) {
    //     e.preventDefault();
    // }

    // const userIds = this.state.values.map((v) => v.id);
    // if (userIds.length === 0) {
    //     return;
    // }

    // if (this.props.skipCommit && this.props.onAddCallback) {
    //     this.props.onAddCallback(this.state.values);
    //     this.setState({
    //         saving: false,
    //         inviteError: null,
    //     });
    //     this.onHide();
    //     return;
    // }

    // this.setState({saving: true});

    // actions.addUsersToChannel(channel.id, userIds).then((result) => {
    //     if (result.error) {
    //         this.handleInviteError(result.error);
    //     } else {
    //         this.setState({
    //             saving: false,
    //             inviteError: null,
    //         });
    //         this.onHide();
    //     }
    // });
};

  renderAriaLabel = (option) => {
      if (!option) {
          return null;
      }
      return option.username;
  }

  onHide = () => {
    this.setState({showEventModal: false});
    this.setUsersLoadingState(false);
  };

  render() {
    const {shareModal, date, Month, current_month, current_year, Year, NumberOfDays, reminders, index, showModal, eventflag, selectedvalue, eventID, deleteflag } = this.state;
    let day = date.getDate();
    const print = () => {
      this.filterdate();
      let listId = 1;
      let c = new Date(current_year, current_month - 1).getDay();
      let list = []
      let i = 1;
      let commonEvent = []
      this.addEventDate = [...this.addEventDate];
      for (let i = 0; i < c; i++) {
        list.push(<li></li>);
      }

      for (let j = 1; j <= NumberOfDays; j++) {
        let counter = 1;
        let flag = true;
        for (let i = 0; i < this.addEventDate.length; i++) {
          let c = '';

          if (this.addEventDate[i].onlydate == j) {
            // checkevents
            for (let k = i + 1; k < this.addEventDate.length; k++) {
              if (this.addEventDate[i].onlydate == j) {
                if (this.addEventDate[i].onlydate == this.addEventDate[k].onlydate && this.addEventDate[i].onlydate != 0) {
                  c++;
                  c == 1 ? commonEvent.push({ date: this.addEventDate[i].onlydate, title: this.addEventDate[i].title, des: this.addEventDate[i].description, id: this.addEventDate[i].id }) : null
                  commonEvent.push({ date: this.addEventDate[k].onlydate, title: this.addEventDate[k].title, des: this.addEventDate[k].description, id: this.addEventDate[k].id })
                  this.addEventDate[k].onlydate = 0;
                }
              }
            }
            // end for loop
            // Events
            if (this.addEventDate[i].onlydate == j && flag) {
              if (this.addEventDate[i] != 0) {
                list.push(
                  <li id={listId++} className={day == j && c == 0 ? 'current-date event' : 'event'} >
                    {
                      this.addEventDate[i].onlydate == j ?
                        <div>
                          <div className='inline-event'>
                            <h2>{j}</h2>
                            {
                              c == 0 ? <div className='inline-event_'>
                                <span onClick={() => this.shareEvent(this.addEventDate[i].id)} className='_fa_share'><i class="fa fa-share" aria-hidden="true"></i></span>
                                <span onClick={() => this.openModel(this.addEventDate[i].id, this.addEventDate[i].onlydate, 1)} ><i className="fa fa-pencil" aria-hidden="true" ></i></span>
                                <span onClick={c == 0 ? () => this.confirm(this.addEventDate[i].id) : null} className="fa fa-times" style={{marginTop: 3}}></span>
                              </div> : null
                            }

                          </div>
                          <p style={{ fontWeight: 600, margin: '0px' }} >{this.addEventDate[i].title}</p>
                          <p className='event-title'>{this.addEventDate[i].description}</p>
                          <span id={j} onClick={this._tooltip} className='total-event'>{c > 0 ? "+" + c + " " + "more" : null}</span>
                          {c > 0 ? (index == j) && this.state._tooltip ? <div id={j} className='tooltip-container' >
                            <span id='close-event-modal' onClick={this.close} >&times;</span>
                            <div className='_tooltip'>
                              {
                                commonEvent.map((e) =>
                                  <div className='more-event-data' >
                                    <div className='sub-event-data'>
                                      <span onClick={() => this.shareEvent(e.id)} className='share'>
                                        <i class="fa fa-share" aria-hidden="true"></i>
                                      </span>
                                      <span onClick={() => this.openModel(e.id, e.date, 1)} ><i class="fa fa-pencil" aria-hidden="true" ></i></span>
                                      <span className="delete-event-button" onClick={() => this.confirm(e.id)}>&times;</span>
                                    </div>
                                    <p className='more-event-data-title' >{(counter++) + "  " + e.title}</p>
                                    <p>{e.des}</p></div>
                                )
                              }
                            </div>
                          </div> : null
                            : null
                          }

                        </div> : null}
                  </li>);
                flag = false
              }
            }
          }
        }
        if (flag) {
          {
            list.push(<li id={listId++} className={day == j ? 'current-date' : null}  >{j}</li>);
          }
        }

      }
      return list;
    }

    const buttonSubmitText = "Share";
    const buttonSubmitLoadingText = "Sharing...";
    const numRemainingText = <span>Enter username for filter list</span>

    const content = (
      <MultiSelect
          key='addUsersToCalendarKey'
          options={this.state.users}
          optionRenderer={this.renderOption}
          values={this.state.values}
          valueRenderer={this.renderValue}
          ariaLabelRenderer={this.renderAriaLabel}
          perPage={USERS_PER_PAGE}
          handlePageChange={this.handlePageChange}
          handleInput={this.search}
          handleDelete={this.handleDelete}
          handleAdd={this.addValue}
          handleSubmit={this.handleSubmit}
          maxValues={MAX_SELECTABLE_VALUES}
          numRemainingText={numRemainingText}
          buttonSubmitText={buttonSubmitText}
          buttonSubmitLoadingText={buttonSubmitLoadingText}
          saving={this.state.saving}
          loading={this.state.loadingUsers}
          placeholderText= "Search and Share Event"
      />
  );

    return (
      <>
        <Scrollbars>
          <LegacySidebar />
          <div className="container">
            {/* <form>
              <span><i class="fa fa-search" style={{ fontSize: '20px', color: '#bababa' }}></i></span>
              <input type='search' placeholder='Search for events.' />
              <button>Find Events</button>
              <select><option>Month</option>
                <option>1</option>
              </select>
            </form> */}
            <div className='inline-container'>
              <span>
                <i class="fa fa-angle-left" style={{ fontSize: '35px', color: '#bababa' }} onClick={this._prevMonth}></i>
              </span>
              <span>
                <i class="fa fa-angle-right" style={{ fontSize: '35px', color: '#bababa' }} onClick={this._nextMonth}></i>
              </span>
              {/* <span className='day'>Today</span> */}
              <select id='select' className='select-year' onChange={this._getMonth}>
                <option >{Month[this.state.current_month - 1]}</option>
                {
                  Month.map((i, index) => <option value={index + 1}>{i}</option>)
                }
              </select>
              <select onChange={this.getYear} value={this.state.current_year} id='select' className='select-year'>
                <option>{this.state.current_year}</option>
                {
                  Year.map((i, index) => <option value={i}>{i}</option>)
                }
              </select>
              <button id='modal-btn' onClick={this.openModel}>
                <span><i class="fa fa-plus" /></span>
                <span>Create</span>
              </button>
              <div className={showModal ? 'event-modal' : 'hide-event-modal'}  >
                <div class="_modal-content">
                  <span id='close' class="close" onClick={() => { this.setState({ showModal: false }) }} >&times;</span>
                    <div className='modal-sub-content'>
                    <input className='title-input-field' value={this.state.title} onChange={this.inputTitle} placeholder='Add title' />
                    {/* <div className='modal-button'>
                      <button onClick={eventflag ? () => this.updateEvent(eventID) : this.postEvent}>Event</button>
                    </div> */}
                    <div className='modal-sub-content-values'>
                      <input type='date' value={this.state.showdate} className='date' onChange={this.inputDate} />
                      <input type='text' value={this.state.description} onChange={this.inputDescription} placeholder='Add description' className='description' />
                      <button style={{ position: 'initial', padding: '10px 20px' }} onClick={eventflag ? () => this.updateEvent(eventID) : this.postEvent}>Add Event</button>
                    </div>
                  </div>
               </div>
              </div>
              </div>
              <div className='weekdays'>
                <ul style={{display: 'flex'}}>
                  <li>SUN</li>
                  <li>MON</li>
                  <li>TUE</li>
                  <li>WED</li>
                  <li>THU</li>
                  <li>FRI</li>
                  <li>SAT</li>
                </ul>
              </div>
              <div className='days'>
                {
                  <ul>
                    {
                      print()
                    }
                  </ul>
                }
              </div>
            </div>
        </Scrollbars>
        <Modal
          id='addUsersToChannelModal'
          dialogClassName='a11y__modal more-modal'
          show={this.state.showEventModal}
          onHide={this.onHide}
          // onExited={this.props.onHide}
          role='dialog'
          aria-labelledby='channelInviteModalLabel'
      >
          <Modal.Header closeButton={true}>
              <Modal.Title
                  componentClass='h1'
                  id='channelInviteModalLabel'
              >
                Share Event
              </Modal.Title>
          </Modal.Header>
          <Modal.Body
              role='application'
          >
              {content}
          </Modal.Body>
      </Modal>

      </>
    );
  }
}

function mapStateToProps(state, props) {
  const users = getNonBotUsers(state, false, 'no_team', false, null);
  return {
      users,
  };
}
export default connect(mapStateToProps)(Calendar);
// export default Calendar;
