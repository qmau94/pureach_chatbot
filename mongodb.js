var mongo = require('mongodb');

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://pureach:123456@ds149763.mlab.com:49763/pureach";

MongoClient.connect(url, function(err, db) {
  query = {type: 1};
  db.collection("products").find(query).forEach(function(doc){
    console.log(doc.name);
    console.log(doc.type);
  });
  db.close();
});


