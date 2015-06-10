items = new Mongo.Collection("items")



if (Meteor.isClient) {
  Session.setDefault("numberOfSubs",10)

  var subsApp=new SubsManager()
  var counter=function(init){
    var self=this
    self.dep=new Tracker.Dependency

    self.i=(_.isNumber(init))?init:0
  }
  counter.prototype.reset=function(init)
  {
    this.i=(_.isNumber(init))?init:0
    this.dep.changed()
  }
  counter.prototype.inc=function(inc)
  {
    this.i+=(_.isNumber(inc))?inc:1
    this.dep.changed()
  }
  counter.prototype.get=function()
  {
    this.dep.depend()
    return this.i
  }
  var waitOnCounter=new counter()
  var trackerCounter=new counter()

  Tracker.autorun(function(){
    trackerCounter.inc()
      _.each(_.range(Session.get("numberOfSubs")),function(page){
            return subsApp.subscribe("items",page)
          })
  })
  Router.route("/",{
    template:"hello",
    waitOn:function()
    {
      try{
        waitOnCounter.inc()
        return _.map(_.range(Session.get("numberOfSubs")),function(page){
              return subsApp.subscribe("items",page)
            }
          )
        }
        catch(e)
        {
          console.error(e)
        }
    }
  })

  Template.noIronRouter.helpers({
    waitOnCounter:function()
    {
      return waitOnCounter.get()
    },
    trackerCounter:function()
    {
      return trackerCounter.get()
    },
    numberOfSubs:function()
    {
      return Session.get("numberOfSubs")
    }

  })
  Template.noIronRouter.events({
    "keyup input":function(evt,tpl)
    {
      var i=parseInt(evt.target.value)
      if(_.isNumber(i) && i>0)
      Session.set("numberOfSubs",i)
    },
    "click button":function()
    {
      waitOnCounter.reset()
      trackerCounter.reset()
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    if(!items.find().count())
    {
      for(var i=0;i<100;i++)
        {
          for(var j=0;j<100;j++)
            items.insert({name:"item "+(i+1)*j})

            console.log((i+1)*100,"items created")
        }
    }
  });

  Meteor.publish("items",function(page){
    return items.find({},{limit:10,skip:page*10})
  })
}
