//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const mongooseUrl = "mongodb+srv://"+process.env.DB_USER + ":" + process.env.DB_PWD + "@todolist.lmd1j.mongodb.net/todolistDB";

mongoose.connect(mongooseUrl,{
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
//create Schema for the new item
const itemSchema = {
  name : String,
}
//create a listSchema that's associate with itemSchema
const listSchema = {
  name : String,
  items : [itemSchema]
}
//whenever you have a mongoose model it's always Capitalized
const Item = mongoose.model("item" ,itemSchema);
const List = mongoose.model("lists",listSchema);

const item1 = new Item({
  name:"Welcome to your todolist",
})

const item2 = new Item({
  name:"Hit the + botton to add a new item",
})

const item3 = new Item({
  name:"<- tick the checbox to delete an item",
})

const defaultItems = [item1,item2,item3];



app.get("/", function(req, res) {

  Item.find(function(err,result){

    if(result.length === 0){ // if there's no item in the defaultItems array

      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Items inserted successfully.");
        }
      });

      res.redirect("/"); // then it will go else then render the page with the default items

    }else{
      res.render("list", {listTitle: "Today", newListItems: result});
    }

  });
});

app.get("/:customListName",function(req,res){

  //console.log(req.params.customListName);
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName},function(err,result){

    if(result){// if there's a listname matched , just render the items
        //console.log("exist");
        res.render("list",{listTitle:result.name ,newListItems:result.items})
    }else{
        // if the customListName doesn't exist in the current lists , creat a new list and add it into the lists array
        //console.log("doesn't exist");
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
    }

  });



  //res.render("list", {listTitle: newListName, newListItems: result});

})

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name:itemName
  });

  if (listName ==="Today"){
    item.save();
    res.redirect("/");
  }else{
    List.findOne({name:listName},function(err,result){
      result.items.push(item);
      result.save();
      res.redirect("/"+listName);
    })
  }

});

app.post("/delete",function(req,res){

  const id_itemToRemove = req.body.checkbox;
  const listName = req.body.listName;

  if(listName ==="Today"){
    Item.findByIdAndRemove(id_itemToRemove,function(err){
      if(err){
        console.log(err);
      }else{
        console.log("Removed the item by ID successfully");
      }
      res.redirect("/");
    });
  }else{
    //query.findOneAndUpdate(conditions, update, callback)
    //{ $pull: { <field1>: <value|condition>, <field2>: <value|condition>, ... } }
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:id_itemToRemove}}},function(err,foundList){
                                          //pull from the items array , the one with id_itemToRemove
      if(!err){
        res.redirect("/"+listName);
      }

    });
  }
})

app.get("/work", function(req,res){
  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == ""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started successfully.");
});
