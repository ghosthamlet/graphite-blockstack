import React, { Component } from "react";
import { Link } from "react-router-dom";
import ReactDOM from 'react-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Profile from "./Profile";
import Signin from "./Signin";
import Header from "./Header";
import {
  isSignInPending,
  isUserSignedIn,
  redirectToSignIn,
  handlePendingSignIn,
  signUserOut
} from "blockstack";

const blockstack = require("blockstack");
const wordcount = require("wordcount");

export default class TestDoc extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: [],
      textvalue: "",
      test:"",
      rando: "",
      updated: "",
      words: "",
      confirm: false,
      loading: "hide",
      save: "",
      cancel: false
    }
    this.handleaddItem = this.handleaddItem.bind(this);
    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleCancel = this.handleCancel.bind(this);
    this.saveNewFile = this.saveNewFile.bind(this);
  }

  componentWillMount() {
    if (isSignInPending()) {
      handlePendingSignIn().then(userData => {
        window.location = window.location.origin;
      });
    }
    // this.enableTab('textarea1');
  }

  componentDidMount() {
    blockstack.getFile("documents.json", true)
     .then((fileContents) => {
        this.setState({ value: JSON.parse(fileContents || '{}').value })
        console.log("loaded");
     })
      .catch(error => {
        console.log(error);
      });
    this.enableTab('textarea1');
    // this.autoSave();
    // this.refresh = setInterval(() => this.autoSave(), 3000);
  }

  handleTitleChange(e) {
    this.setState({
      textvalue: e.target.value
    });
  }
  handleChange(value) {
      this.setState({ test: value })
    }
  handleaddItem() {
    if(this.state.textvalue || this.state.test) {
      const today = new Date();
      const day = today.getDate();
      const month = today.getMonth() + 1;
      const year = today.getFullYear();
      const rando = Math.floor((Math.random() * 2500) + 1);
      const object = {};
      object.title = this.state.textvalue || "Untitled";
      object.content = this.state.test;
      object.id = rando;
      object.updated = month + "/" + day + "/" + year;
      object.words = wordcount(this.state.test);
      this.setState({ value: [...this.state.value, object] });
      // this.setState({ confirm: true, cancel: false });
      this.setState({ loading: "show" });
      this.setState({ save: "hide"});
      setTimeout(this.saveNewFile, 500)
    } else {
      location.href = '/';
    }
  };

  autoSave() {
    const object = {};
    object.title = this.state.textvalue;
    object.content = this.state.test;
    object.id = parseInt(this.props.match.params.id);
    this.setState({ value: object })
    blockstack.putFile("/autosave.json", JSON.stringify(this.state), true)
      .then(() => {
        console.log("Saved behind the scenes" + JSON.stringify(this.state));
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });
  };

  saveNewFile() {
    // this.setState({ loading: "show" });
    // this.setState({ save: "hide"});
    blockstack.putFile("documents.json", JSON.stringify(this.state), true)
      .then(() => {
        console.log(JSON.stringify(this.state));
        location.href = '/';
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });
  }
  handleCancel() {
    this.setState({ confirm: false, cancel: true});

  }

  handleDoubleSpace() {
    this.setState({ lineSpacing: "materialize-textarea double-space" });
  }

  handleSingleSpace() {
    this.setState({ lineSpacing: "materialize-textarea single-space" });
  }

  enableTab(id) {
      var el = document.getElementById(id);
      el.onkeydown = function(e) {
          if (e.keyCode === 9) { // tab was pressed

              // get caret position/selection
              var val = this.value,
                  start = this.selectionStart,
                  end = this.selectionEnd;

              // set textarea value to: text before caret + tab + text after caret
              this.value = val.substring(0, start) + '\t' + val.substring(end);

              // put caret at right position again
              this.selectionStart = this.selectionEnd = start + 1;

              // prevent the focus lose
              return false;

          }
      };
  }

  print(){
    const curURL = window.location.href;
    history.replaceState(history.state, '', '/');
    window.print();
    history.replaceState(history.state, '', curURL);
  }

  render() {
    const words = wordcount(this.state.test);
    const loading = this.state.loading;
    const save = this.state.save;
    const lineSpacing = this.state.lineSpacing;
    console.log(this.state.test);
    return (
      <div>
      <div className="navbar-fixed toolbar">
        <nav className="toolbar-nav">
          <div className="nav-wrapper">
            <a onClick={this.handleaddItem} className="brand-logo"><div className={save}><i className="material-icons">arrow_back</i></div></a>
            <div className={loading}>
            <div className="preloader-wrapper loading-small active">
              <div className="spinner-layer spinner-green-only">
                <div className="circle-clipper left">
                  <div className="circle"></div>
                </div><div className="gap-patch">
                  <div className="circle"></div>
                </div><div className="circle-clipper right">
                  <div className="circle"></div>
                </div>
              </div>
            </div>
            </div>
            <div className={save}>
              <ul id="dropdown2" className="dropdown-content">
                <li><a onClick={this.handleSingleSpace}>Single Space</a></li>
                <li><a onClick={this.handleDoubleSpace}>Double Space</a></li>
              </ul>
              <ul className="left toolbar-menu">
                <li><a onClick={this.print}><i className="material-icons">local_printshop</i></a></li>
                <li><a className="dropdown-button" href="#!" data-activates="dropdown2">Formatting<i className="material-icons right">arrow_drop_down</i></a></li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
        <div className="container docs">
        <div className="card">
        <div className="input-field">
          <input className="print-title" type="text" placeholder="Title" onChange={this.handleTitleChange} />
          <div className="doc-margin">

          <ReactQuill value={this.state.test}
                  onChange={this.handleChange} />

            <textarea
              type="text"
              id="textarea1"
              placeholder="Write something great"
              className="materialize-textarea double-space"
              onChange={this.handleChange}
            />
            <div className="right-align wordcounter">
              <p className="wordcount">{words} words</p>
            </div>
          </div>
        </div>
        </div>
        <div>
          <div className={save}>
          <button className="btn black" onClick={this.handleaddItem}>
            Save
          </button>
          </div>
          <div className={loading}>
          <div className="preloader-wrapper small active">
            <div className="spinner-layer spinner-green-only">
              <div className="circle-clipper left">
                <div className="circle"></div>
              </div><div className="gap-patch">
                <div className="circle"></div>
              </div><div className="circle-clipper right">
                <div className="circle"></div>
              </div>
            </div>
          </div>
          </div>
        </div>
        </div>

      </div>
    );
  }
}
