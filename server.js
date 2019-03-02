
    
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const MongoClient=require('mongodb').MongoClient
const cors = require('cors')
const mongoose = require('mongoose')
var ObjectId = require('mongodb').ObjectId
const promise=require('promise')
//mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )
var url=process.env.MLAB_URI
//var url="mongodb://localhost:27017/mydb"
/*MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Database created!");
  db.close();
});*/
MongoClient.connect(url,function(err,db){
  if(err) throw err
  var dbo=db.db("db1")
  dbo.collection('exercise').update(
    {},
    {$set:{username: String,log:[]}},{multi:true}
  )
  })


function validateUser(user ,callback){
  //console.log(typeof user)
  MongoClient.connect(url,function(err,db){
    if(err) return err
    var dbo1=db.db("db1")
    var myObj1={username:user}
    var f=dbo1.collection("exercise").find(myObj1).count()
    .then(function(num){
      console.log(num)
      if(num>0) callback(null,true)
      else callback(null,false)
    })
   dbo1.close()
  })
   
}
  
function validateUserId(userId,callback){
     MongoClient.connect(url,function(err,db){
    if(err) return err
    var dbo1=db.db("db1")
    //console.log("ert")
    //var myObj1={id:userId}
    //console.log(myObj1)
    var f=dbo1.collection("exercise").find({_id:ObjectId(userId)}).count()
    .then(function(num){
      console.log(num)
      if(num>0) callback(null,true)
      else callback(null,false)
    })
   dbo1.close()
  })

}
 
function UpdateExercise(user,desc,dur,dat,callback){
  MongoClient.connect(url,function(err,db){
    if(err) return err
    var dbo=db.db("db1")
    var r=new Date()
    var MyObj={'_id':ObjectId(user),description:desc,duration:dat,date:dat}
    //{$set:{"description":desc}}
    var newValues={$push:{log:{description:desc,"duration":dur,date:dat}}}
   
    dbo.collection("exercise").findOneAndUpdate({"_id":ObjectId(user)},newValues,{returnOriginal: false})
    .then(function(num){
      console.log(num)
      var result={}
      result.id=user
      result.description=desc
      result.duration=dur
      result.date=dat
      callback(null,result)
    })
     dbo.close() 
    
  })
  
}

function InsertUser(user,callback){
  MongoClient.connect(url,function(err,db){
    //console.log("op")
    if(err) {callback(err,null) 
             return }
    var dbo=db.db("db1")
    var myObj={username:user}
    //console.log(myObj)
    dbo.collection("exercise").insert(myObj,function(err,db){
      
      if(err) {callback(err,null) 
             return }
      
      dbo.close();
      var result={}
      result.username=myObj.username
      result.id=myObj._id
      
      callback(null,result)
      
    })
  })
  
}

function findUser(user,callback){
  MongoClient.connect(url,function(err,db){
    //console.log("op")
    if(err) {callback(err,null) 
             return }
    var dbo=db.db("db1")
    var myObj={_id:ObjectId(user)}
    dbo.collection('exercise').find(myObj).toArray()
    .then(function(num){
      /*console.log("er")
      console.log(num[0])
      for(var i=0;i<2;i++){
        num.log.description=num.descrption[i]
        num.log.duration=num.duration[i]
        num.log.date=num.date[i]
      }*/
      
      //console.log(num)
      callback(null,num)
    })
          }) 
    
}

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user',function(req,res){
  //res.send("dfbhjfb")
  var input=req.body.username
 
  
  validateUser(input,function(err,data){ 
    
    if(err) return err
    if(data){
      
    res.send("already an ID")
    }
    else{
      InsertUser(input,function(err,t){
    if (err){ console.log(err)
            
            }
    console.log(t)
    //res.writeHead(200, {"Content-Type": "text/json"});
    res.json(t);
    //res.json({username:t.username,id:t.id})
  })
    }
  })

})

app.post('/api/exercise/add',function(req,res){
    var input=req.body.userId
     var desc=req.body.description
  var dur=req.body.duration
  var dat=req.body.date
  
  if(dat==''){
    var r=new Date()
    dat=(r.getMonth()+1)+"-"+r.getDate()+"-"+r.getFullYear()
  }
  console.log(dat)
    //console.log(input)
    validateUserId(input,function(err,data){
      if(err) return err
      else {if(!data){
        res.send("Unknown Id")
      }
      else{
        UpdateExercise(input,desc,dur,dat,function(err,data){
          //console.log(desc)
          if(err) return err
          else{
            console.log(data)
            res.json(data)
          }
        
        })
      }
           }
    
    })
})

app.get('/api/exercise/log/:user',function(req,res){
  var f=req.params.user
  //console.log(f)
  validateUserId(f,function(err,data){
      if(err) return err
      else {if(!data){
        res.send("Unknown Id")
      }
      else{
        findUser(f,function(err,data){
          //console.log(desc)
          if(err) return err
          else{
            console.log(data[0])
            res.json(data)
          }
        
        })
      }
           }
    
    })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

