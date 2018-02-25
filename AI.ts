//Imports
import{Report} from "./Report";
import{Room} from "./Room";
import {BuildingManager} from "./BuildingManager";
import {FlagManager} from "./FlagManager";

export class AI{
    rooms;
    buildingManager:BuildingManager;
    flagManager:FlagManager

    constructor()
    {
        //Create Memory.lar if it doesn't exsist
        if(!Memory.lar)
            Memory.lar = {};

        if(!Memory.report)
            Memory.report = [];

        let rooms = {};

        //Create/load all the rooms
        Object.keys(Game.rooms)
            .forEach(function (key)
            {
                let tempRoom = new Room(key,true);
                rooms[key] = tempRoom;
            });
        this.rooms = rooms;

        //Load the BuildingManager
        this.buildingManager = new BuildingManager();

        this.flagManager = new FlagManager();
    }

    public execute():void
    {
        //Check for rooms that the AI can no longer can see
        for(let roomName in Memory.lar)
        {
            if(!Game.rooms[roomName])
                delete Memory.lar[roomName];//save memory by removing the room


            for(let i = 0; i < Memory.lar[roomName].sources.length; i++)
            {
                let names:Array<String> = Memory.lar[roomName].sources[i].others;
                for(let j = 0; j < names.length; j++)
                {
                    names.forEach(function(key)
                    {
                        if(!Game.creeps[key])
                            Memory.lar[roomName].sources[i].others.splice(j,1);

                    });
                }

                names = Memory.lar[roomName].sources[i].miners;
                for(let j = 0; j < names.length; j++)
                {
                    names.forEach(function(key)
                    {
                        if(!Game.creeps[key])
                            Memory.lar[roomName].sources[i].miners.splice(j,1);

                    });
                }
            }

        }



        //Check for creeps that no longer exist
        for(let name in Memory.creeps)
        {
            if(!Game.creeps[name]){
                delete Memory.creeps[name];//save memory by removing the creep
            }
        }



        //consoleResult = "#Rooms: " + Object.keys(Game.rooms).length;

        //Operate on all the rooms
            //check to see if a room needs help
        this.manageRooms();
        this.flags();



        this.save();//Save all the rooms
        //Generate a report of the game status
        if(Game.time % 20 == 0)
        {
            let report = new Report();
            report.run();
            Memory.report = [];
        } else
        {
            let index = Game.time % 20;
            Memory.report[index] = Game.cpu.getUsed();
        }

    }

    private manageRooms():void
    {
        for(let key in this.rooms)
        {
            //console.log("Rooms: " + JSON.stringify(this.rooms[key]));
            this.rooms[key].runRoom();

            this.buildingManager.runRoom(this.rooms[key]);
        }
    }

    private flags():void
    {
        for(let key in Game.flags)
        {
            let flag = Game.flags[key];
            let room = Game.rooms['E45N38'];
            //console.log(JSON.stringify(flag));
            switch(flag.color)
            {
                case COLOR_WHITE:this.white_flag(flag,room);
                    break;
                case COLOR_RED:this.red_flag(flag,room);
                    break;
            }
        }
    }

    private red_flag(flag,room)
    {
        //TODO attack
        switch(flag.secondaryColor)
        {
            case COLOR_GREEN: //TODO Ready to attack
                break;
            case COLOR_RED: //TODO Prepare for attack
                break;
            case COLOR_ORANGE://TODO
        }
    }

    private white_flag(flag,room)
    {
        //Determine the closest room to the expansion flag
        switch(flag.secondaryColor)
        {
            case COLOR_WHITE:this.create_settler(flag,room);//make a settler to claim/reserve a room
                break;
            case COLOR_GREEN://check for spawn
                //console.log(JSON.stringify(flag));

                if(Memory.lar[flag.pos.roomName].spawns.length > 0)
                {
                    flag.remove();
                    return;
                }

                let creeps = Memory.lar[flag.room.name].creeps.filter(function(c)
                {
                    //console.log(JSON.stringify(c));
                    return c.memory.role == 'r_builder';
                });
                if(creeps.length < 5)
                {
                    //console.log("Creating Remote Builder: " + room.name);
                    this.create_remote_builder(flag,room);
                }
                return;
        }
    }

    private create_settler(flag,room):void
    {

        //console.log(JSON.stringify(room));
        //return;
        //Determine settler's body
        //Able to spend like 1500 on creep
        //CLAIM = 600
        //MOVE = 50
        //CARRY = 50
        //WORK = 100
        //TOTAL_BODY = 8MOVE, CLAIM
        //TOTAL_COST = 400 + 600 + 200 + 30
        let body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CLAIM,CLAIM];

        //Name settler
        let givenRole = "settler";

        //
        let action_result = -666;
        //console.log(flag.pos.roomName);
        //build a settler (Once built the room manager should take care of the creep
        for(let i = 0; i < Memory.lar[room.name].spawns.length; i++)
        {
            if(Memory.lar[room.name].spawns[i].spawning == null)
            {
                //create a creep
                action_result = Memory.lar[room.name].spawns[i].spawnCreep(body, givenRole + Game.time, {
                    memory: {role: givenRole, source:"", expandTo: flag.pos.roomName}
                });

                switch(action_result)
                {
                    case OK:
                        //change flag color and then return?
                        flag.setColor(COLOR_WHITE,COLOR_GREEN);

                        //display spawner visual
                        room.visual.text(
                            '🛠️settler',
                            room.spawns[i].pos.x - 3,
                            room.spawns[i].pos.y + 1,
                            {align: 'left', opacity: 0.8});
                        return;
                    case ERR_NOT_ENOUGH_RESOURCES://keep trying
                        break;
                    default:
                        console.log("Attempting to make a settler: " + action_result);
                        return
                }
            }
        }
    }

    /**
     * Builds a creep and sends them to the room the flag is in
     * @param flag
     * @param room - The room from which to build the creep
     */
    private create_remote_builder(flag,room):void
    {
        //Determine settler's body
        //Able to spend like 1500 on creep
        //CLAIM = 600
        //MOVE = 50
        //CARRY = 50
        //WORK = 100
        //TOTAL_BODY = 8MOVE,2WORK,6CARRY
        //TOTAL_COST =400 + 600 + 200 + 30
        let body = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];

        //Name r_builder
        let givenRole = "r_builder";

        //
        let action_result = -666;

        //build a remote_builder (Once built the room manager should take care of the creep
        for(let i = 0; i < Memory.lar[room.name].spawns.length; i++)
        {
            let spawn = Memory.lar[room.name].spawns[i];

            if(spawn.spawning == null)
            {
                //create a creep
                action_result = spawn.spawnCreep(body, givenRole + Game.time, {
                    memory: {role: givenRole, source:"",expandTo:flag.room.name}
                });

                switch(action_result)
                {
                    case OK:
                        //change flag color and then return?
                        flag.setColor(COLOR_WHITE,COLOR_GREEN);

                        //display spawner visual
                        room.visual.text(
                            '🛠️r_builder',
                            spawn.pos.x - 3,
                            spawn.pos.y + 1,
                            {align: 'left', opacity: 0.8});
                        return;
                    default:
                        console.log("Attempting to make a remote_builder: " + action_result);
                        return
                }
            }
        }
    }

    //TODO save the game state
    private save():void
    {
        return;
        for(let roomName in Game.rooms)
        {
            this.rooms[roomName].save();
        }
    }

    private findWithAttr(array, attr, value):number
    {
        for(var i = 0; i < array.length; i += 1) {
            if(array[i][attr] === value) {
                return i;
            }
        }
        return -1;
    }
}




