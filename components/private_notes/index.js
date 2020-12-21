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
            result: [],
            flag: true,
            currentIndexID: '',
            currentIndexTitle: '',
            totalNotes: 0
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
        const url = new URL('http://localhost:8065/api/v4/notes');
        fetch(url, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
            },

        }).then((response) => response.json())
            .then((result) => {
                this.setState({
                    responsedata: result,
                    totalNotes: result.length
                })
            })
            .catch((err) => { console.log('error', err) })
    }

    setdata = async () => {
        const url = 'http://localhost:8065/api/v4/notes';
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
        this.setState({
            currentNotes: this.state.currentNotes.concat(result)
        })
        this.getAlldata();
    }

    getDataById = (index) => {
        this.setState({ currentItem: index })
        const id = this.state.responsedata[index].id;

        const url = new URL(`http://localhost:8065/api/v4/notes/${id}`);
        fetch(url, {
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
            },

        }).then((response) => response.json())
            .then((result) => {
                this.setState({ result })
            })
            .catch((err) => { console.log('error', err) })
    }

    delete = (index) => {
        const id = this.state.responsedata[index].id;
        let url = new URL(`http://localhost:8065/api/v4/notes/${id}`);
        fetch(url, {
            method: 'DELETE',
            headers: {
                accept: '*/*',
                'Content-Type': 'text/plain;charset=utf-8',
                "X-CSRF-Token": document.cookie.split("MMCSRF=")[1],
                Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
            },
        })
            .then((response) => {
                this.getAlldata();
            })
            .catch((err) => { console.log('error--', err) })
    }

    put(index) {
        this.setState({
            flag: false,
            currentIndexID: this.state.responsedata[index].id,
            title: this.state.responsedata[index].name,
        })
        this.inputRef.focus();
    }

    updateNotes = (id, title) => {
        this.setState({ flag: true })

        let url = new URL(`http://localhost:8065/api/v4/notes/${id}`);
        fetch(url, {
            method: 'PUT',
            headers: {
                accept: '*/*',
                'Content-Type': 'text/plain;charset=utf-8',
                "X-CSRF-Token": document.cookie.split("MMCSRF=")[1],
                Authorization: 'Bearer ' + '7p9kg4usgff63fq1fqu4364heh',
            },
            body: JSON.stringify({
                name: this.state.title,
                body: this.state.text,
            })
        }).then((response) => {
            this.setState({ title: '', text: '' })
            this.getAlldata();
        })
            .catch((err) => {
                console.log(err)
            })

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
                            <Scrollbars style={{ height: '94%' }} autoHide={true}>
                                <div className='note-content' >
                                    {this.state.responsedata.map((value, index) => (
                                        <div key={index} >
                                            <div>
                                                <div style={{ float: 'right', padding: '5px' }}>
                                                    <span onClick={() => { this.put(index) }} ><i class="fa fa-pencil" aria-hidden="true" style={{ fontSize: '15px', marginRight: '8px', cursor: 'pointer' }} ></i></span>
                                                    <span onClick={() => this.delete(index)} ><i class="fa fa-times" aria-hidden="true" style={{ color: 'red', opacity: 0.7, fontSize: '18px', cursor: 'pointer' }} ></i></span>
                                                </div>
                                            </div>
                                            <h4><b>{value.name}</b></h4>
                                            <div onClick={() => this.getDataById(index)} style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', color: '#737373' }}>{value.body}</div>
                                        </div>
                                    ))
                                    }

                                </div>
                            </Scrollbars>

                        </div>
                        <div className='left-container' >
                            <div className='private-note-header' >
                                <div className='book-icon'>
                                    <i class="fa fa-book" aria-hidden="true" style={{ color: '#7a8083', fontSize: '18px', }} ></i>
                                    <p onClick={() => this.getDataById(0)}>My Notes</p>
                                </div>
                                <button><i class="fa fa-plus" aria-hidden="true" style={{ color: 'white', fontSize: '12px', marginRight: '10px' }} ></i>New Note</button>
                            </div>
                            <div className='note-input-data'>
                                {this.state.currentItem >= 0 ? this.state.responsedata[this.state.currentItem].body : ''}
                            </div>
                            <div className='input-box'>
                                <div>
                                    <input type='text' className='note-title' placeholder={'Title'} value={this.state.title} onChange={this.handleTitle} />
                                    <input type='text' className='note-body' placeholder={'Start writing'} value={this.state.text} onChange={this.input} ref={ref => { this.inputRef = ref; }} />
                                </div>
                                <button style={{ color: 'white', fontSize: '12px', marginRight: '10px', border: 0, padding: '14px 30px', borderRadius: 3 }} onClick={this.state.flag ? this.show : () => this.updateNotes(this.state.currentIndexID, this.state.cureentIndexTitle)} >Add Notes</button>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}
export default PrivateNote;