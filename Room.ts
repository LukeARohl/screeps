//Imports
import {Dispatcher} from "./Dispatcher";
import {Spawner} from "./Spawner";
import {Job} from "./Job";

export class Room{
    sources;
    droppedSource;
    jobs;
    buildings;
    constructionSites;
    room;
    spawns;
    hostileCreeps;
    towers;
    creeps;

    needEnergy:boolean;
    giveEnergy:boolean;
    needDefense:boolean;
    giveDefense:boolean;


    name:string;

    /**
     * Creates a new Room.ts Object
     * @param {string} roomName - the name of the room
     * @param {boolean} force - if true recalculates all the room info, otherwise tries to pull it from memory
     */
    constructor(roomName:string, force = false)
    {
        this.name = roomName;
        this.room = Game.rooms[roomName];



        //Check if this room already exist in memory
        if(!Memory.lar.hasOwnProperty(roomName))
            Memory.lar[roomName] = {};

        //Check if this room already has it's sources set
        if(!Memory.lar[roomName].hasOwnProperty("sources"))
            this.sources = this.room.find(FIND_SOURCES);
        else
            this.sources = Memory.lar[roomName].sources;

        this.droppedSource = Game.rooms[roomName].find(FIND_DROPPED_RESOURCES);
        this.droppedSource.sort(function(a,b){
            return b.energy - a.energy;
        });

        if(!Memory.lar[roomName].hasOwnProperty("jobs"))
            this.jobs = [];
        else
            this.jobs = Memory.lar[roomName].jobs;

        if(!Memory.lar.hasOwnProperty("buildings") || force) //if Memory doesn't have buildings
        {
            this.buildings = this.room.find(FIND_STRUCTURES);
            this.constructionSites = this.room.find(FIND_CONSTRUCTION_SITES);
        } else {
            this.buildings = Memory.lar[roomName].buildings;
            this.constructionSites = Memory.lar[roomName].constructionSites;
        }

        if(!Memory.lar[roomName].hasOwnProperty("spawns") || force)
            this.spawns = this.room.find(FIND_MY_STRUCTURES, {
                filter: { structureType: STRUCTURE_SPAWN }
            });
        else
            this.spawns = Memory.lar[roomName].spawns;


        if(!Memory.lar[roomName].hasOwnProperty("towers") || force) { //if Memory doesn't have towers
            let tempTowers = this.room.find(FIND_MY_STRUCTURES, {
                filter: {structureType: STRUCTURE_TOWER}
            });

            this.towers = tempTowers.sort(function(b1, b2)
            {
                return b2.store[RESOURCE_ENERGY] - b1.store[RESOURCE_ENERGY];
            });
        }else
            this.towers = Memory.lar[roomName].towers;


        //Find all the creeps in the room
        this.creeps = this.room.find(FIND_MY_CREEPS);
        this.creeps.sort(function(c1,c2)
        {
            if(c1.memory.role == 'hauler')
            {
                return -1;//want hauler at top
            } else if(c2.memory.role == 'hauler')
            {
                return 1;
            }
            return 0;
        });

        //this.dispatcher  = new Dispatcher(this,force);
        this.hostileCreeps = this.room.find(FIND_HOSTILE_CREEPS);

        //Set Paths
        //if storage exists, then make a path from storage to controller
        //

        //determine if this room needs help or not
        if(this.room.energyAvailable < 300)
        {
            this.needEnergy = true;
        } else
            this.needEnergy = false;
        //TODO determine if this room can give energy to another


        let droppedSourceAmount = 0;

        for(let i = 0; i < this.droppedSource.length; i++)
        {

            droppedSourceAmount += this.droppedSource[i].amount;
        }

        if(droppedSourceAmount > 500 || (Game.rooms[this.name].storage && Game.rooms[this.name].storage.store[RESOURCE_ENERGY] > 10000))
            this.giveEnergy = true;
        else
            this.giveEnergy = false;


        //TODO determine if this room needs help defending itself
        this.needDefense = false;
        //TODO Determine if this room can help defend another room
        this.giveDefense = false;


        //Save the room
        Memory.lar[this.name] = this;

        // console.log(this.name);
        //this.dispatcher = new Dispatcher(this);

    }//End of Constructor

    runRoom():void
    {
        this.runSpawns();
        this.defendRoom();
        this.runCreeps();
        //TODO operate links
    }

    //Should do this every... 10 ticks?
    //TODO
    generateJobs():void
    {

        return;
        let tempJobs = [];

        let not_full_spawns = _.filter(this.spawns, function(s)
        {
            return s.energy < s.energyCapacity;
        });

        for(let i =  0; i < not_full_spawns.length; i++)
        {
            let tempJob = new job(5,not_full_spawns[i], 'refill');
            //console.log(tempJob.priority);
            tempJobs.push(tempJob);
        }

        Memory.lar[this.name].jobs.push(tempJobs);
        console.log("Jobs after generating: " + Memory.lar[this.name].jobs.length);


        Memory.lar[this.name].jobs = [];
    }

    /**
     * Has the Dispatcher take care of managing the creeps
     */
    runCreeps():void
    {
        let dispatcher = new Dispatcher();
        dispatcher.runCreeps(this);
    }

    /**
     * Performs the necessary room defense procedures
     */
    defendRoom():void
    {
        let hostiles = Memory.lar[this.room.name].hostileCreeps;
        if(hostiles.length > 0 && this.towers.length < 1)
        {
            //create defense creep
            //TODO create or use defensive creep
            this.room.controller.activateSafeMode();
        } else if (this.towers.length > 0)
        {
            runTowers(hostiles, this);
        }

        if(this.room.controller.hits < this.room.controller.hitsMax && hostiles.length > 0)
        {
            this.room.controller.activateSafeMode();
        }
    }

    /**
     * Has the Spawner handle the current creep situation
     */
    runSpawns():void
    {
        let spawner = new Spawner();

        for(let i = 0; i < this.spawns.length; i++)
        {
            spawner.run(this.spawns[0]);
            break; //TODO how to manage multiple spawns
        }

    }

    /**
     * Saves the Room object into memory
     *
     * Currently save sources to memory
     * //TODO
     */
    save():void
    {
        /*
        //TODO These are the things that need to be saved
        sources;
        jobs;
        buildings;
        constructionSites;
        room;
        spawns;
        hostileCreeps;
        towers;
        creeps;
        needEnergy:boolean;
        needDefense:boolean;

        name:string;
        */

        Memory.lar[this.name] = {};
        Memory.lar[this.name].sources = JSON.stringify(this.sources);
    }

}

function runTowers(hostiles, LARRoom):void
{
    let towers = LARRoom.towers;
    if(hostiles.length > 0)
    {//attack hostiles
        for(let i = 0; i < towers.length; i++)
        {
            towers[i].attack(towers[i].pos.findClosestByRange(hostiles));
        }
    } else
    {//repair stuff
        let buildings_to_repair = Memory.lar[LARRoom.name].buildings.filter(function(b){
            return b.hits != b.hitsMax && b.hits < 3000;
        });

        buildings_to_repair.sort(function(b1,b2)
        {
            return b1.hits - b2.hits;
        });

        let j = 0;
        for(let i = 0; i < buildings_to_repair.length; i++)
        {
            //TODO let tower = buildings_to_repair[i].pos.findClosestByRange(towers);
            let action_result = towers[i].repair(buildings_to_repair[i]);
            j++;
            if(j >= towers.length)
            {
                break;
            }
        }
    }
}

