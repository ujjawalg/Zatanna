import React, { Component } from 'react';
import {Loader, Dimmer, Message, Form, Input, Button} from 'semantic-ui-react';
import config from '../config';
import web3 from '../ethereum/web3';
import ZatannaInstance from '../ethereum/Zatanna';
import S3Client from 'aws-s3';
import SparkMD5 from 'spark-md5';
//import AWS from 'aws-sdk';

var Buffer = require('buffer/').Buffer
//AWS.config.update({accessKeyId: 'AKIAI2RTDMUJXXMBUAIA',secretAccessKey: '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'});
//const s3 = new AWS.S3();

class UploadSong extends Component {
  state = {
    name:'',
    cost:'',
    duration:'',
    genre:'',
    role:'',
    songHash:'',
    actualSong:'',
    userAccount:'',
    loadingData:false,
    loading:false,
    errorMessage:'',
    msg:'',
  }

  async componentDidMount(){
    this.setState({loadingData:true});
    document.title = "Zatanna | Upload Song";

    try{
      const accounts = await web3.eth.getAccounts();
      const role = await ZatannaInstance.methods.getRole().call({from:accounts[0]});
      this.setState({role:role, userAccount:accounts[0]});

    }catch(err){
      console.log(err);
    }

    this.setState({loadingData:false});
  }

  fileCapture = async (file) => {
    //console.log(file);
    this.setState({errorMessage:'', loading:true, msg:''});
    
    if (file.type.split('/')[0] === 'audio'){
      try{
        let reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = async () => {
          const buffer = Buffer.from(reader.result);
          var spark = new SparkMD5.ArrayBuffer();
          spark.append(buffer);
          this.setState({songHash:spark.end().toString()});
        }

        const isUnique = await ZatannaInstance.methods.songIsUnique(this.state.songHash).call({from: this.state.userAccount});
        if (parseInt(isUnique) === 0){
          this.setState({actualSong:file});
        }else{
          this.setState({errorMessage:"The song that you're uploading is not unique. Piracy is a punishable offence!"})
        }

      }catch(err){
        console.log("error: ",err.message);
      }
    }else{
      this.setState({errorMessage:'Not a audio file!'});
    }

    this.setState({loading:false});
  }

  onSubmit = async (event) => {
    event.preventDefault();

    this.setState({errorMessage:'', loading:true, msg:''});
    if (this.state.role === '1'){
      try{
        const config = {
          bucketName: 'zatanna-music-upload',
          region: 'us-east-1',
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
          dirName: 'songs', // optional
        }

        await S3Client.uploadFile(this.state.actualSong, config); // Thanks to https://github.com/Fausto95/aws-s3
        await ZatannaInstance.methods.artistUploadSong(this.state.cost, this.state.duration, this.state.name, this.state.genre, "s3link1", this.state.songHash).send({from:this.state.userAccount});
        this.setState({msg:"Song Uploaded Successfully!"});
      }catch(err){
        this.setState({errorMessage:err.message, msg:''});
      }
    }else{
      this.setState({errorMessage:"You're not registered as an Artist!"});
    }

    this.setState({loading:false});
  }

  render() {
    if(this.state.loadingData){
      return (
          <Dimmer active inverted>
            <Loader size='massive'>Loading...</Loader>
          </Dimmer>
      );
    }

    let statusMessage;

    if (this.state.msg === ''){
      statusMessage = null;
    }else{
      statusMessage = <Message floating positive header="Success!" content={this.state.msg} />;
    }

    return (
      <div>
      {this.state.role==='1' &&
        <Form onSubmit={this.onSubmit} error={!!this.state.errorMessage}>
          <Form.Field>
            <label>Song Name</label>
            <Input onChange={event => this.setState({name:event.target.value})} />
          </Form.Field>
          <Form.Field>
            <label>Cost</label>
            <Input 
              label="wei"
              labelPosition='right' 
              value={this.state.cost}
              onChange={event => this.setState({cost: event.target.value})}
            />
          </Form.Field>
          <Form.Field>
            <label>Duration</label>
            <Input 
              label="seconds"
              labelPosition='right'
              value={this.state.duration}
              onChange={event => this.setState({duration: event.target.value})}
            />
          </Form.Field>
          <Form.Field>
            <label>Song Genre</label>
            <Input onChange={event => this.setState({genre:event.target.value})} />
          </Form.Field>
          <Form.Field>
            <label>Choose the song file</label>
            {/*<Input type='file' onChange={event => this.setState({actualSong:event.target.files[0]})} />*/}
            <Input type='file' onChange={event => this.fileCapture(event.target.files[0])} />
          </Form.Field>
          <Message error header="Oops!" content={this.state.errorMessage} />
          <Button primary basic loading={this.state.loading}>
            Upload
          </Button>
          {statusMessage}
        </Form>
      }

      {this.state.role!=='1' &&
        <h2>You are not registered as an Artist!</h2>
      }
      </div>
    );
  }
}

export default UploadSong;