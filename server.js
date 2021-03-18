const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
var CryptoJS = require("crypto-js");
var WebSocket = require("ws");

var http_port = process.env.HTTP_PORT || 3000;

var name, enroll, email, degree_no, cgpa, datetime, issuer, email;
var data={};

const apiKey = '*****************';

class Block {
    constructor(index, previousHash, timestamp, data, hash) {
        this.index = index;
        this.previousHash = previousHash.toString();
        this.timestamp = timestamp;
        this.data = data;
        this.hash = hash.toString();
    }
}

var sockets = [];
var MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
};

var getGenesisBlock = () => {
    return new Block(0, "0", 1465154705, "my genesis block!!", "816534932c2b7154836da6afc367695e6337db8a921823784c14378abed4f7d7");
};

var blockchain = [getGenesisBlock()];

var initHttpServer = () => {
    var app = express();
    app.use(express.static('public'));
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.set('view engine', 'ejs');

    app.get('/', function (req, res) {
      res.render('index');
    });

    app.get('/2', function (req, res) {
      res.render('index2');
    });
    

    app.post('/', function (req, res) {
     
    });
     app.post('/3', function (req, res){
      var data1={};
      name=req.body.name;
      enroll=req.body.enroll;
      degree_no=req.body.degree_no;
      branch=req.body.branch;
      cgpa=req.body.cgpa;
      email=req.body.email;
      issuer=req.body.mobile;
      datetime=req.body.datetime;
      data1['name']=name;
      data1['email']=email;
      data1['enroll']=enroll;
      data1['branch']=branch;
      data1['cgpa']=cgpa;
      data1['degree_no']=degree_no;
      data1['issuer']=issuer;
      data1['datetime']=datetime;

    

      var chain=JSON.stringify(blockchain);
      var obj2 = JSON.parse(chain);
      var count=0;
      // res.send(obj2);

      if(obj2.length>2){
        for(var i=1;i<obj2.length;i++){
            if(enroll===obj2[i].data.enroll){
              // found=obj[i];
              count=1;
              break;
            }
            else if(degree_no===obj2[i].data.degree_no){
              count=2;
              break;
            }
        }
      }
      if(count==0){
        var newBlock = generateNextBlock(data1);
        addBlock(newBlock);
        broadcast(responseLatestMsg());
        var data2=JSON.stringify(newBlock);
        console.log('block added: ' + data2);
        // res.send(newBlock);
        var obj = JSON.parse(data2);
        var prehash=obj.previousHash;
        var timestamp=obj.timestamp;
        var hash=obj.hash;
        var enroll1=obj['data'].enroll;
        res.render('index3', {name:name, enroll:enroll1, degree_no:degree_no,
        branch:branch, cgpa:cgpa, email:email, issuer:issuer, datetime:datetime,
        prehash:prehash, timestamp:timestamp, hash:hash, error: null});
      }else if(count==1){
        var invalid="Invalid! Enroll Already";
        res.render('index5', {invalid:invalid, error: null});
      }else{
        var invalid="Invalid! Degree No Already Exist";
        res.render('index5', {invalid:invalid, error: null});
      }
    });

    app.post('/4', function (req, res){
      var SEnroll=req.body.SEnroll;
      console.log(SEnroll);
      var chain=JSON.stringify(blockchain);
      var obj = JSON.parse(chain);
      var count=0;

      var found={};
      for(var i=1;i<obj.length;i++){
          if(SEnroll===obj[i]['data'].enroll){
            // found=obj[i];
            found=obj[i];
            count=1;
            break;
          }
          else if(SEnroll===obj[i]['data'].degree_no){
            found=obj[i];
            count=1;
            break;
          }
      }
      // console.log(found);
      // res.send(found);
      if(count== 1){
        var obj1 = found;
        var name=obj1['data'].name;
        var enroll=obj1['data'].enroll;
        var degree_no=obj1['data'].degree_no;
        var  branch=obj1['data'].branch;
        var cgpa=obj1['data'].cgpa;
        var email=obj1['data'].email;
        var issuer=obj1['data'].issuer;
        var datetime=obj1['data'].datetime;
        var prehash=obj1['data'].prehash;
        var timestamp=obj1['data'].timestamp;
        var hash=obj1['data'].hash;
        var prehash=obj1.previousHash;
        var timestamp=obj1.timestamp;
        var hash=obj1.hash;
        res.render('index4', {name:name, enroll:enroll, degree_no:degree_no,
        branch:branch, cgpa:cgpa, email:email, issuer:issuer, datetime:datetime,
        prehash:prehash, timestamp:timestamp, hash:hash, error: null});
      }else{
          res.send("This Enroll and Degree No are Not Found.");
        }
      
    });



  app.get('/blocks', (req, res) => res.send(JSON.stringify(blockchain)));
      app.get('/mineBlock', (req, res) => {
          var newBlock = generateNextBlock(data);
          addBlock(newBlock);
          broadcast(responseLatestMsg());
          console.log('block added: ' + JSON.stringify(newBlock));
          res.send();
      });
    
  app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });
  };


var generateNextBlock = (blockData) => {
    var previousBlock = getLatestBlock();
    var nextIndex = previousBlock.index + 1;
    var nextTimestamp = new Date().getTime() / 1000;
    var nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimestamp, blockData);
    return new Block(nextIndex, previousBlock.hash, nextTimestamp, blockData, nextHash);
};


var calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data);
};

var calculateHash = (index, previousHash, timestamp, data) => {
    return CryptoJS.SHA256(index + previousHash + timestamp + data).toString();
};

var addBlock = (newBlock) => {
    if (isValidNewBlock(newBlock, getLatestBlock())) {
        blockchain.push(newBlock);
    }
};

var isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index');
        return false;
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previoushash');
        return false;
    } else if (calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log(typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock));
        console.log('invalid hash: ' + calculateHashForBlock(newBlock) + ' ' + newBlock.hash);
        return false;
    }
    return true;
};


var getLatestBlock = () => blockchain[blockchain.length - 1];
var queryChainLengthMsg = () => ({'type': MessageType.QUERY_LATEST});
var queryAllMsg = () => ({'type': MessageType.QUERY_ALL});
var responseChainMsg = () =>({
    'type': MessageType.RESPONSE_BLOCKCHAIN, 'data': JSON.stringify(blockchain)
});
var responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
});

var write = (ws, message) => ws.send(JSON.stringify(message));
var broadcast = (message) => sockets.forEach(socket => write(socket, message));

// connectToPeers(initialPeers);
initHttpServer();
// initP2PServer();


