const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const token = process.env.FB_VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN;
const SHOP_ADDRESS = 'Ecolife Capital, Tố Hữu, Trung Văn, Từ Liêm, Hà Nội, Vietnam'

// mongodb
var mongo = require('mongodb');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://pureach:123456@ds149763.mlab.com:49763/pureach";

function mongoQuery(type){
  MongoClient.connect(url, function(err, db) {
  query = {type: type};
  db.collection("products").find(query).forEach(function(doc){
    console.log(doc.name);
    console.log(doc.type);
  });
  db.close();
});
}

app.set('port', (process.env.PORT || 5000));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.listen(app.get('port'),function(){
  console.log('running on port', app.get('port'));
});


app.get('/',function (req, res){
  res.send("Pureach chatbot v1.0");
});

// webhook confirmation
app.get('/webhook/', function(req, res){
  if(req.query['hub.verify_token'] === token) {
      console.log("Verified webhook");
      res.status(200).send(req.query['hub.challenge']);
    } else  {
      console.error("Verification failed. The tokens do not match.");
      res.sendStatus(403);
    }
});


// requests from FM
app.post('/webhook', function (req, res) {
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry){
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      if(entry.messaging) {
        entry.messaging.forEach(function(event){
          if (event.message && event.message.is_echo != true) {
            if (event.message.quick_reply) {
            // console.log("QREPLY:", event)
              receivedQuickReply(event);
            } else {
              receivedMessage(event);
            }
          } else if (event.postback){
            receivedPostBack(event);
          } else {
            console.log("ERROR: ", event);
          }
        });
      }
    });
    res.sendStatus(200);
  }
});


// received functions
function receivedPostBack(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var postback = event.postback;
  var payload = postback.payload;

  switch (payload) {
    case 'GET_STARTED_PAYLOAD':
      sendGreeting(senderID);
      break;
    case 'SKILL_CARE_PAYLOAD':
      sendSkillCare(senderID);
      break;
    case 'HAIR_CARE_PAYLOAD':
      sendHairCare(senderID);
      break;
    case 'BODY_CARE_PAYLOAD':
      sendBodyCare(senderID);
      break;
    case 'GET_LOCATION_PAYLOAD':
      sendGetLocation(senderID);
      break;
    default:
      console.log(payload);
  }

  console.log("Received postback for user %d and page %d at %d with payload:",
  senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(postback.payload));
}

function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:",
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    sendTextMessage(senderID, messageText);
  } else if (messageAttachments) {

    if (messageAttachments[0].type === "location") {
      sendShippingPrice(senderID, messageAttachments[0].payload.coordinates);
    } else {
      sendTextMessage(senderID, "Message with attachment received");
    }
  }
}

function sendShippingPrice(recipientId, possition){
  var lat = possition.lat
  var long = possition.long
  var customerPossition = String(lat) + "," + String(long)
  var distance = require('google-distance');

  distance.get(
    {
      origin: customerPossition,
      destination: SHOP_ADDRESS
    },
    function(err, data) {
      if (err) return console.log(err);
      shipPrice(recipientId, parseFloat(data.distance));
      console.log("ADDRESS: ", data.origin);
  });
}

function shipPrice(recipientId, distance){
  console.log(distance);
  if (0< distance && distance <= 5){
    var msg = "Khoảng cách đến shop là " + distance + "km , gía ship là 20.000 nha."
    sendTextMessage(recipientId,msg);
  } else if (5 < distance && distance <= 9) {
    var msg = "Khoảng cách đến shop là " + distance + "km , gía ship là 25.000 nha."
    sendTextMessage(recipientId,msg);
  } else if (9 < distance && distance <= 11) {
    var msg = "Khoảng cách đến shop là " + distance + "km , gía ship là 30.000 nha."
    sendTextMessage(recipientId,msg);
  } else if (11< distance && distance <= 20) {
    var msg = "Khoảng cách đến shop là " + distance + "km , gía ship là 35.000 nha."
    sendTextMessage(recipientId,msg);
  } else {
    var msg = "Khoảng cách đến shop là " + distance + "km , bạn tham khảo bảng gía ship COD nhé."
    sendTextMessage(recipientId,msg);
  }
}


function receivedQuickReply(event){
  // console.log("QUICKREPLY: ", event);
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var payload = event.message.quick_reply.payload;

  console.log("PAYLOAD", payload);
  switch (payload) {
    case 'LAMSACH_PAYLOAD':
      sendLamSach(senderID);
      break;
    case 'TRIMUN_PAYLOAD':
      sendTriMun(recipientID);
      break;
    case 'TRITHAM_PAYLOAD':
      sendTriTham(recipientID);
      break;
    case 'LAMTRANG_PAYLOAD':
      sendLamTrang(recipientID);
      break;
    case 'DUONGAM_PAYLOAD':
      sendDuongAm(recipientID);
    default:
      console.log(payload);
  }
}

// received functions


// send functions
// main menu

function sendSkillCare(recipientId) {
  var messageData = {
    recipient:{
    id:recipientId
  },

  "message":{
    "text":"Loại sản phẩm:",
    "quick_replies":[
      {
        "content_type":"text",
        "title":"Làm sạch",
        "payload":"LAMSACH_PAYLOAD"
      },
      {
        "content_type":"text",
        "title":"Trị mụn",
        "payload":"TRIMUN_PAYLOAD"
      },
      {
        "content_type":"text",
        "title":"Trị thâm",
        "payload":"TRITHAM_PAYLOAD"
      },
      {
        "content_type":"text",
        "title":"Làm trắng",
        "payload":"LAMTRANG_PAYLOAD"
      },
      {
        "content_type":"text",
        "title":"Dưỡng ẩm",
        "payload":"DUONGAM_PAYLOAD"
      }
    ]
  }
  };

  callSendAPI(messageData);
}

function sendBodyCare(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Body care products"
    }
  };

  callSendAPI(messageData);
}

function sendHairCare(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Hair care products"
    }
  };

  callSendAPI(messageData);
}

// main menu

// skill care

function sendTriMun(recipientId) {
  var product = mongoQuery(1);
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: product
    }
  };

  callSendAPI(messageData);
}


function sendLamSach(recipientId){
  var messageData = {
    "recipient":{
    "id": recipientId
  },
  "message": {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "list",
        "top_element_style": "compact",
        "elements": [
          {
            "title": "Sản phẩm 1",
            "image_url": "https://scontent.fhan2-2.fna.fbcdn.net/v/t31.0-8/14068611_190120021401285_3356893024869799537_o.png?oh=6c7352b93e88865ac26112b2ebf1f008&oe=5A16E004",
            "subtitle": "195.000",
            "default_action": {
              "type": "web_url",
              "url": "https://www.instagram.com/pureachcosmetics",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
              "fallback_url": "https://www.instagram.com/pureachcosmetics/"
            },
            "buttons": [
              {
                "title": "Mua",
                "type": "postback",
                "payload": "ADD_TO_CART_PAYLOAD"
              }
            ]
          },
          {
            "title": "Sản phẩm 2",
            "image_url": "https://scontent.fhan2-2.fna.fbcdn.net/v/t31.0-8/14068611_190120021401285_3356893024869799537_o.png?oh=6c7352b93e88865ac26112b2ebf1f008&oe=5A16E004",
            "subtitle": "200.000",
            "default_action": {
              "type": "web_url",
              "url": "https://www.instagram.com/pureachcosmetics",
              "messenger_extensions": true,
              "webview_height_ratio": "tall",
              "fallback_url": "https://www.instagram.com/pureachcosmetics/"
            },
            "buttons": [
              {
                "title": "Mua",
                "type": "postback",
                "payload": "ADD_TO_CART_PAYLOAD"
              }
            ]
          }
        ],
         "buttons": [
          {
            "title": "Xem thêm",
            "type": "postback",
            "payload": "LAMSACH2_PAYLOAD"
          }
        ]
      }
    }
  }
  };

  callSendAPI(messageData);
}

// skill care
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function sendGetLocation(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    "message":{
      "text":"Gửi vị trí hiện tại của bạn",
      "quick_replies":[
        {
          "content_type":"location",
        }
      ]
  }
  };

  callSendAPI(messageData);
}


function sendGreeting(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: "Xin chào, mình là hệ thống trả lời tự động của Pureach 😉 Trong lúc chờ đợi nhân viên tư vấn hồi đáp, hãy trò chuyện với mình bằng cách lựa chọn vấn đề của bạn dưới đây nhé! Bạn có thể click Send a mesage để gửi tin nhắn đến Pureach."
    }
  };

  var imgMessageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "image",
        payload: {
          url:"https://scontent.fhan2-2.fna.fbcdn.net/v/t31.0-8/14068611_190120021401285_3356893024869799537_o.png?oh=6c7352b93e88865ac26112b2ebf1f008&oe=5A16E004"
        }
      }
    }
  };

  var homeMenu = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [
          {
            title: "Chăm sóc da",
            subtitle: "Next-generation virtual reality",
            item_url: "https://www.oculus.com/en-us/rift/",
            image_url: "https://scontent.fhan2-2.fna.fbcdn.net/v/t1.0-9/20953345_10212242994944323_2733112547956124185_n.jpg?oh=34262e9b38311d70c844f8be1fbce650&oe=5A1FA287",
            buttons: [{
              type: "postback",
              title: "Các loại sản phẩm",
              payload: "SKILL_CARE_PAYLOAD",
            }],
          },
          {
            title: "Chăm sóc tóc",
            subtitle: "Các sản phẩm chăm sóc tóc của Pureach",
            item_url: "https://www.pureach.vn",
            image_url: "https://scontent.fhan2-2.fna.fbcdn.net/v/t1.0-9/20953216_10212242995024325_8774127497199121447_n.jpg?oh=1c589ff8c2798888e4cbc6a53fa0c793&oe=5A2DBD8D",
            buttons: [{
              type: "postback",
              title: "Xem sản phẩm",
              payload: "HAIR_CARE_PAYLOAD",
            }],
          },
          {
            title: "Chăm sóc toàn thân",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",
            image_url: "https://scontent.fhan2-2.fna.fbcdn.net/v/t1.0-9/20953586_10212242994984324_2342588996336267058_n.jpg?oh=d9ac49668e89fb2cc78673ae22b52528&oe=5A1D1450",
            buttons: [{
              type: "postback",
              title: "Các loại sản phẩm",
              payload: "BODY_CARE_PAYLOAD",
            }]
          },{
            title:"Cách thức chuyển hàng",
            subtitle: "Chi phí ship sản phẩm",
            image_url: "https://scontent.fhan2-2.fna.fbcdn.net/v/t31.0-8/14068611_190120021401285_3356893024869799537_o.png?oh=6c7352b93e88865ac26112b2ebf1f008&oe=5A16E004",
            buttons:[{
              title:"Theo vị trí hiện tại",
              type:"postback",
              payload:"GET_LOCATION_PAYLOAD"
            },
            {
              title:"Bảng giá ship",
              type:"postback",
              payload:"SHIP_PRICE_PAYLOAD"
            }]
          },
          {
            title: "About Us",
            subtitle: "Theo dõi Pureach qua các kênh",
            image_url: "https://scontent.fhan2-2.fna.fbcdn.net/v/t31.0-8/14068611_190120021401285_3356893024869799537_o.png?oh=6c7352b93e88865ac26112b2ebf1f008&oe=5A16E004",
            buttons: [{
              type: "web_url",
              url:"https://www.instagram.com/pureachcosmetics/",
              title:"Instagram",
              webview_height_ratio:"full"
            },
            {
              type: "web_url",
              url:"https://www.facebook.com/pureachcosmetics/",
              title:"Facebook",
              webview_height_ratio:"full"
            }]
          }
          ]
        }
      }
    }
  };


  // callSendAPI(imgMessageData);
  callSendAPI(messageData);
  callSendAPI(homeMenu);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.10/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s",
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error("ERROR: ", error);
      console.error("RESPONSE: ", response);
    }
  });
}
