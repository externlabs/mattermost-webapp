import React, { Component, PureComponent } from 'react';
import 'components/private_notes/privatenotes.scss';

import LegacySidebar from 'components/legacy_sidebar'
import Scrollbars from 'react-custom-scrollbars';
import { $CombinedState } from 'redux';
class PrivateNote extends PureComponent {
    constructor() {
        super();
        this.state = {
            text: '',
            data: [],
            responsedata: [],
            title: '',
            currentNotes: [],
            currentItem: -1,
            result: []
        }
    }
    input = (event) => {
        this.setState({ text: event.target.value })
    }

    handleTitle = (event) => {
        this.setState({
            title: event.target.value
        })
    }

    show = () => {
        this.setdata();
        let arr = [...this.state.data];
        arr.push(this.state.text);
        this.setState({ data: arr, text: '' });
    }
    componentDidMount() {
        this.getAlldata();
    }

    getAlldata = () => {
        alert('data')
        const url = new URL('http://localhost:8065/api/v4/notes');
        fetch(url, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
            },

        }).then((response) => response.json())
            .then((result) => {
                this.setState({ responsedata: result })
                this.state.responsedata.map((i, index) => { console.log(this.state.responsedata[index].body) })
            })
            .catch((err) => { console.log('error', err) })
    }

    setdata = async () => {
        const url = 'http://localhost:8065/api/v4/notes';
        // console.log(document.cookie);
        let response = await fetch(url, {
            method: 'POST',
            headers: {
                accept: '*/*',
                'Content-Type': 'text/plain;charset=utf-8',
                "X-CSRF-Token": document.cookie.split("MMCSRF=")[1]
            },
            body: JSON.stringify({
                body: this.state.text,
                name: this.state.title,
            })
        })

        let result = await response.json()
        console.log('result', result);
        this.setState({
            currentNotes: this.state.currentNotes.concat(result)
        })
        console.log('currentNotes', this.state.currentNotes)
    }

    getDataById = (index) => {
        this.setState({ currentItem: index })
        const id = this.state.responsedata[index].id;

        const url = new URL(`http://localhost:8065/api/v4/notes/${id}`);
        console.log('id url----',url)
        fetch(url, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
            },

        }).then((response) => response.json())
            .then((result) => {
                this.setState({ result })
                console.log('called')
            })
            .catch((err) => { console.log('error', err) })
    }

    delete = (index) => {
        alert(index+'nitu')
        // // this.setState({currentItem:index})
        const id = this.state.responsedata[index].id;
        console.log('url----', id)
        let url = new URL(`http://localhost:8065/api/v4/notes/${id}`);
        console.log('url----', url)
        fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
            },

        }).then((response) => { console.log('delete-', response) })
            .catch((err) => { console.log('error--', err) })
    }
    render() {
        return (
            <>
                <LegacySidebar />
                <div
                    ref='channelView'
                    id='app-content'
                    className='app__content'
                    style={{ paddingTop: '0px' }}
                >
                    <div className="private-note-container" >
                        <div className='right-container' >

                            <div className='note-text' >Private Notes</div>
                            <Scrollbars style={{ height: '94%' }} >
                                <div className='note-content' >
                                    {this.state.responsedata.map((value, index) => (
                                        <div key={index} >
                                            <div>
                                                <div style={{ float: 'right', padding: '5px' }}>
                                                    <span><i class="fa fa-pencil" aria-hidden="true" style={{ fontSize: '20px', marginRight: '8px' }}></i></span>
                                                    <span onClick={() => this.delete(index)} ><i class="fa fa-times" aria-hidden="true" style={{ color: 'red', opacity: 0.7, fontSize: '22px', cursor: 'pointer' }}></i></span>
                                                </div>
                                            </div>
                                            <h3><b>{value.name}</b></h3>
                                            <div onClick={() => this.getDataById(index)} style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value.body}</div>
                                        </div>
                                    ))}

                                </div>
                            </Scrollbars>

                        </div>
                        <div className='left-container' >
                            <div className='private-note-header' />
                            <div className='note-input-data'>
                                {this.state.currentItem >= 0 ? this.state.responsedata[this.state.currentItem].body : ''}
                            </div>
                            <div className='input-box'>
                                <input type='text' placeholder={'Note Title'} value={this.state.title} onChange={this.handleTitle} />
                                <input type='text' placeholder={'Note Body'} value={this.state.text} onChange={this.input} />
                                <button onClick={this.show} >Add Notes</button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}
export default PrivateNote;