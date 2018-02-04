import React, { Component } from "react";
import ReactDOM from 'react-dom';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Profile from "../Profile";
import Signin from "../Signin";
import Header from "../Header";
import {
  isSignInPending,
  loadUserData,
  Person,
  getFile,
  putFile,
  lookupProfile
} from 'blockstack';
import update from 'immutability-helper';
const wordcount = require("wordcount");
const blockstack = require("blockstack");
const Quill = ReactQuill.Quill;
const Font = ReactQuill.Quill.import('formats/font');
const { encryptECIES, decryptECIES } = require('blockstack/lib/encryption');
const { getPublicKeyFromPrivate } = require('blockstack');
Font.whitelist = ['Ubuntu', 'Raleway', 'Roboto', 'Lato', 'Open Sans', 'Montserrat'] ; // allow ONLY these fonts and the default
ReactQuill.Quill.register(Font, true);

export default class TestDoc extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: [],
      contacts: [],
      title : "",
      content:"",
      updated: "",
      words: "",
      index: "",
      save: "",
      loading: "hide",
      printPreview: false,
      autoSave: "Saved",
      receiverID: "",
      shareModal: "hide",
      shareFile: [],
      show: "",
      pubKey: ""
    }
    this.handleChange = this.handleChange.bind(this);
    this.handleTitleChange = this.handleTitleChange.bind(this);
    this.handleIDChange = this.handleIDChange.bind(this);
    this.shareModal = this.shareModal.bind(this);
    this.hideModal = this.hideModal.bind(this);
    this.shareDoc = this.shareDoc.bind(this);
    this.sharedInfo = this.sharedInfo.bind(this);
    this.handleBack = this.handleBack.bind(this); //this is here to resolve auto-save and home button conflicts
  }

  componentWillMount() {
    if (isSignInPending()) {
      handlePendingSignIn().then(userData => {
        window.location = window.location.origin;
      });
    }
  }

  componentDidMount() {
    $('.modal').modal({
    dismissible: true, // Modal can be dismissed by clicking outside of the modal
    opacity: .5, // Opacity of modal background
    inDuration: 300, // Transition in duration
    outDuration: 200, // Transition out duration
    startingTop: '4%', // Starting top style attribute
    endingTop: '10%', // Ending top style attribute
    ready: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.

      console.log(modal, trigger);
    },
    complete: function() { console.log('Closed'); } // Callback for Modal close
  }
);

    getFile("contact.json", {decrypt: true})
     .then((fileContents) => {
       if(fileContents) {
         console.log("Contacts are here");
         this.setState({ contacts: JSON.parse(fileContents || '{}').contacts });
       } else {
         console.log("No contacts");
       }
     })
      .catch(error => {
        console.log(error);
      });



      this.printPreview = () => {
        if(this.state.printPreview == true) {
          this.setState({printPreview: false});
        } else {
          this.setState({printPreview: true});
        }
      }
    }


  handleTitleChange(e) {
    this.setState({
      title: e.target.value
    });
  }
  handleChange(value) {
      this.setState({ content: value })
    }

  handleIDChange(e) {
      this.setState({ receiverID: e.target.value })
    }

    handleBack() {
      if(this.state.autoSave == "Saving") {
        setTimeout(this.handleBack, 500);
      } else {
        window.location.replace("/documents");
      }
    }

  handleAutoAdd() {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const object = {};
    object.title = this.state.title;
    object.content = this.state.content;
    object.id = parseInt(this.props.match.params.id);
    object.updated = month + "/" + day + "/" + year;
    object.words = wordcount(this.state.content);
    const index = this.state.index;
    const updatedDoc = update(this.state.value, {$splice: [[index, 1, object]]});  // array.splice(start, deleteCount, item1)
    this.setState({value: updatedDoc});
    this.setState({autoSave: "Saving..."});
    console.log(this.state.value);
    this.autoSave();
  };

  autoSave() {
    putFile("documents.json", JSON.stringify(this.state), {encrypt: true})
      .then(() => {
        console.log("Autosaved");
        this.setState({autoSave: "Saved"});
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });
  }

  shareModal() {
    this.setState({
      shareModal: ""
    });
  }

  sharedInfo(){
    this.setState({ loading: "", show: "hide" });
    const user = this.state.receiverID;
    const userShort = user.slice(0, -3);
    const fileName = 'shareddocs.json'
    const file = userShort + fileName;
    const options = { username: user, zoneFileLookupURL: "https://core.blockstack.org/v1/names"}

    getFile('key.json', options)
      .then((file) => {
        this.setState({ pubKey: JSON.parse(file)})
        console.log("Step One: PubKey Loaded");
      })
        .then(() => {
          this.loadMyFile();
        })
        .catch(error => {
          console.log("No key: " + error);
          Materialize.toast(this.state.receiverID + " has not logged into Graphite yet. Ask them to log in before you share.", 4000);
          this.setState({ shareModal: "hide", loading: "hide", show: "" });
        });
  }

  loadMyFile() {
    const user = this.state.receiverID;
    const userShort = user.slice(0, -3);
    const fileName = 'shareddocs.json'
    const file = userShort + fileName;
    const options = { username: user, zoneFileLookupURL: "https://core.blockstack.org/v1/names"}

    getFile(file, {decrypt: true})
     .then((fileContents) => {
        this.setState({ shareFile: JSON.parse(fileContents || '{}') })
        console.log("Step Two: Loaded share file");

        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const object = {};
        object.title = this.state.title;
        object.content = this.state.content;
        object.id = Date.now();
        object.receiverID = this.state.receiverID;
        object.words = wordcount(this.state.content);
        object.shared = month + "/" + day + "/" + year;
        this.setState({ shareFile: [...this.state.shareFile, object] });
        setTimeout(this.shareDoc, 700);
     })
      .catch(error => {
        console.log(error);
        console.log("Step Two: No share file yet, moving on");
        this.setState({ loading: "", show: "hide" });
        const today = new Date();
        const day = today.getDate();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        const object = {};
        object.title = this.state.title;
        object.content = this.state.content;
        object.id = Date.now();
        object.receiverID = this.state.receiverID;
        object.words = wordcount(this.state.content);
        object.shared = month + "/" + day + "/" + year;
        this.setState({ shareFile: [...this.state.shareFile, object] });
        setTimeout(this.shareDoc, 700);
      });
  }

  hideModal() {
    this.setState({
      shareModal: "hide"
    });
  }

  shareDoc() {
    const user = this.state.receiverID;
    const userShort = user.slice(0, -3);
    const fileName = 'shareddocs.json'
    const file = userShort + fileName;
    putFile(file, JSON.stringify(this.state.shareFile), {encrypt: true})
      .then(() => {
        console.log("Step Three: File Shared: " + file);
        this.setState({ shareModal: "hide", loading: "hide", show: "" });
        Materialize.toast('Document shared with ' + this.state.receiverID, 4000);
      })
      .catch(e => {
        console.log("e");
        console.log(e);
      });
      const publicKey = this.state.pubKey;
      const data = this.state.shareFile;
      const encryptedData = JSON.stringify(encryptECIES(publicKey, JSON.stringify(data)));
      const directory = '/shared/' + file;
      putFile(directory, encryptedData)
        .then(() => {
          console.log("Shared encrypted file " + directory);
        })
        .catch(e => {
          console.log(e);
        });
  }

  print(){
    const curURL = window.location.href;
    history.replaceState(history.state, '', '/');
    window.print();
    history.replaceState(history.state, '', curURL);
  }

  renderView() {

    TestDoc.modules = {
      toolbar: [
        [{ 'header': '1'}, {'header': '2'}, { 'font': Font.whitelist }],,
        [{size: []}],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'},
         {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image', 'video'],
        ['clean']
      ],
      clipboard: {
        // toggle to add extra line breaks when pasting HTML:
        matchVisual: false,
      }
    }
    /*
     * Quill editor formats
     * See https://quilljs.com/docs/formats/
     */
    TestDoc.formats = [
      'header', 'font', 'size',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image', 'video'
    ]

    const words = wordcount(this.state.content);
    const loading = this.state.loading;
    const save = this.state.save;
    const autoSave = this.state.autoSave;
    const shareModal = this.state.shareModal;
    const show = this.state.show;
    const contacts = this.state.contacts;
    var content = "<p style='text-align: center;'>" + this.state.title + "</p>" + "<div style='text-indent: 30px;'>" + this.state.content + "</div>";

    var htmlString = $('<html xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">').html('<body>' +

    content +

    '</body>'

    ).get().outerHTML;

    var htmlDocument = '<html xmlns:office="urn:schemas-microsoft-com:office:office" xmlns:word="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><xml><word:WordDocument><word:View>Print</word:View><word:Zoom>90</word:Zoom><word:DoNotOptimizeForBrowser/></word:WordDocument></xml></head><body>' + content + '</body></html>';
    var dataUri = 'data:text/html,' + encodeURIComponent(htmlDocument);

    if(this.state.printPreview === true) {
      return (
        <div>
        <div className="navbar-fixed toolbar">
          <nav className="toolbar-nav">
            <div className="nav-wrapper">
              <a onClick={this.handleBack} className="brand-logo"><i className="material-icons">arrow_back</i></a>


                <ul className="left toolbar-menu">
                  <li><a onClick={this.printPreview}>Back to Editing</a></li>
                  <li><a onClick={this.print}><i className="material-icons">local_printshop</i></a></li>
                  <li><a download={this.state.title + ".doc"}  href={dataUri}><img className="wordlogo" src="http://www.free-icons-download.net/images/docx-file-icon-71578.png" /></a></li>
                  <li><a onClick={this.shareModal}><i className="material-icons">share</i></a></li>
                  <li><a className="modal-trigger" href="#modal1">Click</a></li>
                </ul>

            </div>
          </nav>
        </div>
        <div className={shareModal}>

          <div id="modal1" className="modal bottom-sheet">
            <div className="modal-content">
              <h4>Share</h4>
              <p>Enter the Blockstack user ID of the person to share with.</p>
              <p>Or select from your contacts.</p>
              <input className="share-input white grey-text" placeholder="Ex: JohnnyCash.id" type="text" value ={this.state.receiverID} onChange={this.handleIDChange} />
              <div className={show}>
                <button onClick={this.sharedInfo} className="btn black white-text">Share</button>
                <button onClick={this.hideModal} className="btn grey">Cancel</button>
              </div>
              <div className={show}>
                <div className="container">
                  <ul className="collection">
                  {contacts.slice(0).reverse().map(contact => {
                      return (
                        <li key={contact.contact}className="collection-item avatar">
                          <img src={contact.img} alt="avatar" className="circle" />
                          <span className="title black-text">{contact.contact}</span>
                          <div>
                            <a onClick={() => this.setState({ receiverID: contact.contact })} className="secondary-content"><i className="blue-text text-darken-2 material-icons">add</i></a>
                          </div>

                        </li>
                      )
                    })
                  }
                  </ul>
                </div>
              </div>
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

          <div className="container">





        </div>



        <div className="container docs">
          <div className="card doc-card">
            <div className="double-space doc-margin">
              <p className="center-align print-view">
              {this.state.title}
              </p>
              <div>
                <div
                  className="print-view no-edit"
                  dangerouslySetInnerHTML={{ __html: this.state.content }}
                />
              </div>
              </div>
              </div>
        </div>

        </div>
      );
    } else {
      return (
        <div>
        <div className="navbar-fixed toolbar">
          <nav className="toolbar-nav">
            <div className="nav-wrapper">
              <a onClick={this.handleBack} className="brand-logo"><i className="material-icons">arrow_back</i></a>


                <ul className="left toolbar-menu">
                <li><a onClick={this.printPreview}>Export Options</a></li>
                </ul>
                <ul className="right toolbar-menu auto-save">
                <li><a className="muted">{autoSave}</a></li>
                </ul>

            </div>
          </nav>
        </div>
          <div className="container docs">
            <div className="card doc-card">
              <div className="double-space doc-margin">
              <h4 className="align-left">
              <input className="print-title" placeholder="Title" type="text" value={this.state.title} onChange={this.handleTitleChange} />
              </h4>

              <ReactQuill
                modules={TestDoc.modules}
                formats={TestDoc.formats}
                id="textarea1"
                className="materialize-textarea print-view"
                placeholder="Write something great"
                value={this.state.content}
                onChange={this.handleChange} />

              <div className="right-align wordcounter">
                <p className="wordcount">{words} words</p>
              </div>
              <div className={save}>
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
          </div>
      );
    }
  }

  render() {
    console.log(this.state.receiverID);

    return (
      <div>
        {this.renderView()}
      </div>
    );
  }
}
