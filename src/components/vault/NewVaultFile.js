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
const avatarFallbackImage = 'https://s3.amazonaws.com/onename/avatar-placeholder.png';

export default class NewVaultFile extends Component {
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
      id: "",
      name: "",
      type: "",
      files: [],
      singleFile: {},
      loading: "hide",
      show: ""
  	};
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDropRejected = this.handleDropRejected.bind(this);
    this.save = this.save.bind(this);
    this.saveTwo = this.saveTwo.bind(this);
  }

  componentDidMount() {
  getFile("uploads.json", {decrypt: true})
   .then((fileContents) => {
     this.setState({ files: JSON.parse(fileContents || '{}') });
   })
    .catch(error => {
      console.log(error);
    });
  }

  handleDrop(files) {
    var file = files[0]
    const reader = new FileReader();
    reader.onload = (event) => {
       const object = {};
       object.file = file;
       object.link = event.target.result;
       object.name = file.name;
       object.size = file.size;
       object.type = file.type;
       object.lastModified = file.lastModified;
       object.lastModifiedDate = file.lastModifiedDate;
       object.id = Date.now();
       const objectTwo = {};
       objectTwo.id = object.id;
       objectTwo.name = object.name;
       objectTwo.type = object.type;
       this.setState({id: objectTwo.id, name: objectTwo.name});
       if(object.size > 111048576) {
         this.handleDropRejected();
       }else {
         this.setState({singleFile: object});
         this.setState({files: [...this.state.files, objectTwo] });
         this.setState({ loading: "", show: "hide"})
         setTimeout(this.save, 700)
       }

      // console.log(event.target.result);
      // console.log(object);
   };
   reader.readAsDataURL(file);
   // this.setState({ files: [...this.state.files, object]})
 }

 handleDropRejected(files) {
  console.log("Error file too large");
  Materialize.toast('Sorry, your file is larger than 1mb', 4000) // 4000 is the duration of the toast
}

save() {
    console.log(this.state.files);
    console.log(this.state.singleFile);
    const file = this.state.id + '.json';
    putFile(file, JSON.stringify(this.state.singleFile), {encrypt:true})
      .then(() => {
        console.log("Saved!");
        this.saveTwo();
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });

  }

  saveTwo() {
    putFile("uploads.json", JSON.stringify(this.state.files), {encrypt:true})
      .then(() => {
        console.log("Saved!");
        window.location.replace("/vault");
      })
      .catch(e => {
        console.log("e");
        console.log(e);
        alert(e.message);
      });
  }

  render() {
    const dropzoneStyle = {
      width  : "100%",
      height : "400px",

      marginTop: "74px",
      background: "#eb6a5a",
      paddingTop: "10%",
      cursor: "pointer"
    };
    let key = Date.now();
    let files = this.state.files;
    // files.slice(0).reverse().map(file => {
    //   return(console.log(file.name))
    // });
    console.log(files);
    const { handleSignOut } = this.props;
    const { person } = this.state;
    const show = this.state.show;
    const loading = this.state.loading;
    return (
      !isSignInPending() ?
      <div>
      <div className="navbar-fixed toolbar">
        <nav className="toolbar-nav">
          <div className="nav-wrapper">
            <a href="/vault" className="brand-logo"><i className="material-icons">arrow_back</i></a>


              <ul className="left toolbar-menu">
                <li><a href="/vault">Back to Vault</a></li>
              </ul>

          </div>
        </nav>
      </div>
      <div className="center-align container">
      <h3>Upload a new file</h3>
      <h5>File size limit: 1mb</h5>
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
      <div className={show}>
        <div className="card hoverable">
          <Dropzone
            style={dropzoneStyle}
            onDrop={ this.handleDrop }
            accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,video/quicktime, video/x-ms-wmv,video/mp4,application/pdf,image/png,image/jpeg,image/jpg,image/tiff,image/gif"
            multiple={ false }
            onDropRejected={ this.handleDropRejected }>
            <h1 className="upload-cloud"><i className="material-icons white-text large">cloud_upload</i></h1>
            <h3 className="white-text">Drag files or click to upload</h3>
          </Dropzone>

        </div>
      </div>
      </div>
      </div> : null
    );
  }

  componentWillMount() {
    this.setState({
      person: new Person(loadUserData().profile),
    });
  }
}
