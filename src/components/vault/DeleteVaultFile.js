import React, { Component } from 'react';
import {
isSignInPending,
loadUserData,
Person,
getFile,
putFile,
lookupProfile,
signUserOut,
} from 'blockstack';
import { Link } from 'react-router-dom';
import Dropzone from 'react-dropzone'
import PDF from 'react-pdf-js';
import { Player } from 'video-react';
const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';

export default class DeleteVaultFile extends Component {
  constructor(props) {
  	super(props);

  	this.state = {
  	  person: {
  	  	name() {
          return 'Anonymous';
        },
  	  	avatarUrl() {
  	  	  return avatarFallbackImage;
  	  	},
  	  },
      files: [],
      name: "",
      link: "",
      lastModified: "",
      lastModifiedDate: "",
      size: "",
      type: "",
      index: "",
      pages: "",
      page: "",
      loading: "hide",
      show: ""
  	};
    this.save = this.save.bind(this);
    this.handleDeleteItem = this.handleDeleteItem.bind(this);
  }

  componentDidMount() {
  getFile("files.json", {decrypt: true})
   .then((fileContents) => {
     this.setState({ files: JSON.parse(fileContents || '{}') });
     let files = this.state.files;
      const thisFile = files.find((file) => { return file.id == this.props.match.params.id});
      let index = thisFile && thisFile.id;
      console.log(index);
      function findObjectIndex(file) {
        return file.id == index;
      }
      this.setState({ name: thisFile && thisFile.name, type: thisFile && thisFile.type, lastModified: thisFile && thisFile.lastModified, lastModifiedDate: thisFile && thisFile.lastModifiedDate, size: thisFile && thisFile.size, link: thisFile && thisFile.link, index: files.findIndex(findObjectIndex) })
   })
    .catch(error => {
      console.log(error);
    });
  }

  handleDeleteItem() {
    const object = {};
    object.title = this.state.textvalue;
    object.content = this.state.test;
    object.id = parseInt(this.props.match.params.id);
    this.setState({ files: [...this.state.files, this.state.files.splice(this.state.index, 1)]})
    this.setState({ loading: "show", save: "hide" });
    this.save();
  };

  save() {
    this.setState({ loading: "show" });
    this.setState({ save: "hide"});
    putFile("files.json", JSON.stringify(this.state.files), {encrypt:true})
      .then(() => {
        console.log("Saved!");
        window.location.replace("/");
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });
  }

  render() {
    const loading = this.state.loading;
    const save = this.state.save;
    return (
      !isSignInPending() ?
      <div>
        <div className="container docs">
          <div className="card doc-card">
            <div className="double-space doc-margin delete-doc center-align">
            <h5>
              Delete File
            </h5>
            <h6>Are you sure you want to delete <strong>{this.state.name}</strong>?
            </h6>
            <div className={save}>
            <button className="btn red" onClick={this.handleDeleteItem}>
              Delete
            </button>
            <a href="/"><button className="btn grey">
              No, go back
            </button></a>
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
       : null
    );
  }

  componentWillMount() {
    this.setState({
      person: new Person(loadUserData().profile),
    });
  }
}
