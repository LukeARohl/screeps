//Imports

/**
 * Handles the creep alive creep operations such as where to go etc.
 */
export class Dispatcher{
    /**
     * Manages all the creeps for the given room
     * @param room - the room which needs it's creeps managed
     */
    runCreeps(room):void
    {
        //Iterate over all the creeps in the given room
        for(let i = 0; i < room.creeps.length; i++)
        {
            let creep = room.creeps[i];


            //If the creep can't move quit processing more actions for it
            if(creep.fatigue != 0)
            {
                continue;
            }

            //If the creep is being recycled quit processing more actions for it
            if(!creep.memory.working && recycle(creep))
                continue;

            //Determine whether the creep is working or not
            determineWorking(creep);

            //perform the role the creep has already been assigned to.
            switch(creep.memory.role)
            {
                case 'miner': mine(creep);
                    break;
                case 'hauler': haul(creep);
                    break;
                case 'harvester': harvest(creep);
                    break;
                case 'upgrader': upgrade(creep);
                    break;
                case 'builder': build(creep);
                    break;
                case 'settler': claim(creep);
                    break;
                case 'r_builder': build_remote(creep);
                    break;
                case 'dispenser': dispense(creep);
                    break;
                case 'tester': test(creep);
                    break;
            }
        }
    }
}//end of export

/**
 * This creep's job is to move resources around the room to where they are needed
 * @param creep
 */
function dispense(creep):void
{
    if(creep.carry[RESOURCE_ENERGY] < creep.carryCapacity)
    {
        for(let i = 0; i < Memory.lar[creep.room.name].droppedSource.length; i++)
        {
            if(creep.pos.inRangeTo(Memory.lar[creep.room.name].droppedSource[i],1))
            {
                creep.pickup(Memory.lar[creep.room.name].droppedSource[i]);
                break;
            }
        }
    }


    if(!creep.memory.working)
    {//creep not working
        if(creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 0)
        {
            if(creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(creep.room.storage);
            }
            return;
        }

        //TODO check mining containers?
    }else
    {//creep working

        let structures = Memory.lar[creep.room.name].buildings;

        if(Memory.lar[creep.room.name].hostileCreeps.length > 0)
        {//hostiles are in the room
            let towers = structures.filter(function(s){
                return s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity;
            });
            if(towers.length > 0)
            {
                let tower = towers[0];
                if(creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(tower);
                }
                return;
            }

            let spawn_energy_holders = structures.filter(function (s){
                return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
            });
            if(spawn_energy_holders.length > 0)
            {
                let energy_holder = creep.pos.findClosestByPath(spawn_energy_holders);
                if(creep.transfer(energy_holder, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(energy_holder);
                }
                return;
            }
        } else
        {//hostiles are not in the room
            let spawn_energy_holders = structures.filter(function (s){
                return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
            });
            if(spawn_energy_holders.length > 0)
            {
                let energy_holder = creep.pos.findClosestByPath(spawn_energy_holders);
                if(creep.transfer(energy_holder, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(energy_holder);
                }
                return;
            }

            let towers = structures.filter(function(s){
                return s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity;
            });
            if(towers.length > 0)
            {
                let tower = towers[0];
                if(creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(tower);
                }
                return;
            }

            //TODO move to links

            //Act as a hauler
            //haul(creep);
        }
    }
}

/**
 * This creep's job is to mine from a source and drop it into a container or onto the ground
 * @param creep
 */
function mine(creep):void
{
    let source = Game.getObjectById(creep.memory.source);

    if(!creep.memory.container || creep.memory.container == null)
    {
        let containers = Memory.lar[creep.room.name].buildings.filter(function (s) {
            return s.structureType == STRUCTURE_CONTAINER;
        });

        for(let i = 0; i < containers.length; i++)
        {
            if(containers[i].pos.inRangeTo(source,1))
            {
                creep.memory.container = containers[i].id;
                break;
            }
        }
    }

    let harvest_result = creep.harvest(source);
    let container = Game.getObjectById(creep.memory.container);
    switch(harvest_result)
    {
        case ERR_NOT_ENOUGH_RESOURCES:
        case ERR_NOT_IN_RANGE:
            if(container == null)
                creep.moveTo(source);
            else
                creep.moveTo(container);

            break;
        case OK:
            //do some job logic
            if(container != null && creep.pos != container.pos)
                creep.moveTo(container);
            break;
        default:
            creep.say(harvest_result);
            break;
    }
}

function haul(creep):void
{//TODO assign a source
    /*
    if(creep.carry[RESOURCE_ENERGY] < creep.carryCapacity)
    {
        for(let i = 0; i < Memory.lar[creep.room.name].droppedSource.length; i++)
        {
            if(creep.pos.inRangeTo(Memory.lar[creep.room.name].droppedSource[i],1))
            {
                creep.pickup(Memory.lar[creep.room.name].droppedSource[i]);
                break;
            }
        }
    }*/

    //creep.say("haul");
    if(creep.memory.working)
    {//haul it somewhere
        let structures = Memory.lar[creep.room.name].buildings;
        if(Memory.lar[creep.room.name].hostileCreeps.length > 0)
        {//Hostiles are in the room
            let towers = structures.filter(function (s){
                return s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity;
            });

            if(towers.length > 0)
            {
                let tower = towers[0];
                if(creep.transfer(tower,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(tower);
                }
                return;
            }

            let spawn_energy_holders = structures.filter(function (s){
                return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
            });
            if(spawn_energy_holders.length > 0)
            {
                let energy_holder = creep.pos.findClosestByPath(spawn_energy_holders);
                if(creep.transfer(energy_holder, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(energy_holder);
                }
                return;
            }

            if(creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] < creep.room.storage.storeCapacity)
            {
                if(creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(creep.room.storage);
                }
                return;
            }

            //move it near the spawn
            if(creep.pos.inRangeTo(Memory.lar[creep.room.name].spawns[0],1))
            {
                creep.drop(RESOURCE_ENERGY);
            } else
                creep.moveTo(Memory.lar[creep.room.name].spawns[0]);

        } else
        {//No hostiles in the room
            //TODO prioritize
            let spawn_energy_holders = structures.filter(function (s){
                return (s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_SPAWN) && s.energy < s.energyCapacity;
            });
            if(spawn_energy_holders.length > 0)
            {
                let energy_holder = creep.pos.findClosestByPath(spawn_energy_holders);
                if(creep.transfer(energy_holder, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(energy_holder);
                }
                return;
            }

            let towers = structures.filter(function (s){
                return s.structureType == STRUCTURE_TOWER && s.energy < s.energyCapacity;
            });

            if(towers.length > 0)
            {
                let tower = towers[0];
                if(creep.transfer(tower,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(tower);
                }
                return;
            }

            if(creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] < creep.room.storage.storeCapacity)
            {
                if(creep.transfer(creep.room.storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                {
                    creep.moveTo(creep.room.storage);
                }
                return;
            }


        }


    } else
    {//find source to haul
        let d_source = chooseDropped(creep);
        if(d_source != null)
        {
            if(creep.pickup(d_source) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(d_source);
            }
            return;
        }
    }
}

function harvest(creep):void
{
    if(creep.memory.working)
    {
        let structures = Memory.lar[creep.room.name].buildings;
        let spawns = structures.filter(function (s){
            return s.structureType == STRUCTURE_SPAWN && s.energy < s.energyCapacity;
        });
        if(spawns.length > 0)
        {
            if(creep.transfer(spawns[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(spawns[0]);
            }
            return;
        }

        let extensions = structures.filter(function(s){
            return s.structureType == STRUCTURE_EXTENSION && s.energy < s.energyCapacity;
        });
        if(extensions.length > 0)
        {
            let target = creep.pos.findClosestByRange(extensions);
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(target);
            }
            return;
        }

        let towers = structures.filter(function(s){
            return s.structreType == STRUCTURE_TOWER && s.energy < s.energyCapacity;
        });
        if(towers.length > 0)
        {
            let target = towers[0];
            if(creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(target);
            }
            return;
        }

        //act as a builder
        build(creep);

    } else
    {
        if(creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 1500)
        {
            if(creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(creep.room.storage);
            }
            return;
        }

        let containers = Memory.lar[creep.room.name].buildings.filter(function (s) {
            return s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0;
        });
        if(containers.length > 0)
        {
            //console.log(containers.e);
            containers = containers.sort(function(a,b){
                return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
            });

            let action_result = creep.withdraw(containers[0],RESOURCE_ENERGY);
            switch(action_result)
            {
                case ERR_NOT_IN_RANGE:creep.moveTo(containers[0]);
                    break;
                case OK:
                    break;
                default:creep.say(action_result);
            }
        }


        let dropped_source = Memory.lar[creep.room.name].droppedSource;
        if(dropped_source.length > 0)
        {
            if(creep.pickup(dropped_source[0]) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(dropped_source[0]);
            }
            return;
        }

        let source = Game.getObjectById(creep.memory.source);
        if(creep.harvest(source) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(source);
            return;
        }
    }
}

function upgrade(creep):void
{
    if(creep.memory.working)
    {
        let action_result = creep.upgradeController(creep.room.controller);
        creep.moveTo(creep.room.controller);
        return;
    } else
    {
        //TODO check for energy in a nearby link to use to upgrade
        gather_energy(creep);
    }


}

function build(creep):void
{
    if(creep.memory.working)
    {
        let constructionSites = Memory.lar[creep.room.name].constructionSites;

        if(constructionSites.length > 0)
        {
            /*
            constructionSites = constructionSites.sort(function(c1,c2)
            {
                return c2.progress - c1.progress;
            });*/

            //TODO pos.find replace
            let site = creep.pos.findClosestByRange(constructionSites);
            if(creep.build(site) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(site);
            }
            return;
        }

        //act as a upgrader
        upgrade(creep);
    } else
    {//not working
        gather_energy(creep);
    }
}

function build_remote(creep):void
{


    let action_result = -666;
    if(!creep.memory.working)
    {
        build(creep);
        return;
    }

    if(creep.room.name == creep.memory.expandTo)
    {
        if(Memory.lar[creep.room.name].spawns.length > 0)
        {
            creep.memory.role = "harvester";
        }

        //TODO build(creep);//?
        let controller = creep.room.controller;
        if(creep.room.controller.ticksToDowngrade < 2500)
        {
            if(creep.upgradeController(controller) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(controller);
            }
            return;
        }


        let constructionSites = Memory.lar[creep.room.name].constructionSites;
        if(constructionSites.length > 0)
        {
            //TODO pos.find replace
            let site = creep.pos.findClosestByRange(constructionSites);
            if(creep.build(site) == ERR_NOT_IN_RANGE)
            {
                creep.moveTo(site);
            }
            return;
        }
    } else
    {
        let route = Game.map.findRoute(creep.room, creep.memory.expandTo);
        if(route.length > 0) {
            //console.log('Now heading to room '+route[0].room);
            const exit = creep.pos.findClosestByRange(route[0].exit);
            creep.moveTo(exit);
            return;
        }
    }
}

function claim(creep):void
{
    //if GCL is not enough just reserve it instead

    let action_result = -666;
    //Creep is not in the correct room to expand yet
    if(creep.room.name != creep.memory.expandTo)
    {

        const route = Game.map.findRoute(creep.room, creep.memory.expandTo);
        if(route.length > 0) {
            //console.log('Now heading to room '+route[0].room);
            const exit = creep.pos.findClosestByRange(route[0].exit);
            creep.moveTo(exit);
            return;
        }
    } else
    {
        //Creep is in the same room and should now attempt to reserve/claim the controller
        action_result = creep.claimController(creep.room.controller);

        switch(action_result)
        {
            case OK:creep.room.createConstructionSite(32,10,STRUCTURE_SPAWN);
                break;
            case ERR_NOT_IN_RANGE:creep.moveTo(creep.room.controller);
                break;
            case ERR_GCL_NOT_ENOUGH:creep.moveTo(creep.room.controller);
                //creep.reserveController(creep.room.controller);
                break;
            default:creep.say(action_result);
                break;

        }
    }
}



/**
 * A test function used to test code
 * @param creep
 */
function test(creep):void
{
    creep.say("tester");

}

/**
 * Determines whether the creep is working or not.
 * @param creep - the creep to see if working
 */
function determineWorking(creep):void
{
    //If creep doesn't have memory of working or not
    //Or if creep is out of energy, it is no longer working
    if(!creep.memory.hasOwnProperty("working") || (creep.memory.working && creep.carry[RESOURCE_ENERGY] == 0))
    {
        if(assignSource(creep))
        {
            creep.memory.working = false;
        }
    }

    //If creep has full energy; creep should now be working
    if(!creep.memory.working && creep.carry[RESOURCE_ENERGY] == creep.carryCapacity)
    {
        creep.memory.working = true;
        //TODO assign job here
    }
}

/**
 * Assigns a source to the given creep
 * @param creep - the creep to assign a source to
 * @returns {boolean} - false if a source isn't assigned
 */
function assignSource(creep):boolean
{
    //TODO even distribute source in creep memory
    if(creep.memory.source && creep.memory.source.length > 0)
    {//If creep has source and it's not empty, return true
        return true;
    }

    let source_ids:{}[] = Memory.lar[creep.room.name].sources;


    for(let i = 0; i < source_ids.length; i++)
    {
        let source = Game.getObjectById(source_ids[i].id);
        let creeps_present = check_area(creep.room,source,LOOK_CREEPS,1);


        switch(creep.memory.role)
        {
            case 'miner':

                if(source_ids[i].miners.length > 0) {
                    continue;
                }

                Memory.lar[creep.room.name].sources[i].miners.push(creep.name);
                creep.memory.source = source_ids[i].id;
                return true;

            default:

                //TODO determine which source an other should go to
                if(source_ids[i].others.length > 0)
                    console.log(source_ids[i].others.length);



                if(Memory.lar[creep.room.name].sources.some(
                    function(source)
                    {
                        return source.id == creep.memory.source && !Memory.lar[creep.room.name].sources.others.hasOwnProperty(creep.name);
                    }))
                {
                    let index = Memory.lar[creep.room.name].sources.indexOf(
                        function(source)
                        {
                            return source.id == creep.memory.source;
                        }
                    );

                    Memory.lar[creep.room.name].sources[index].others.push(creep.name);
                    creep.memory.source = source_ids[i].id;
                }

                return true;
        }
    }

    //All sources are busy
    return false;
}

/**
 * Checks the <code>target</code> for the given <code>lookType</code> with in the specified area
 * @param room - the room from which to look in
 * @param target - the target to check around
 * @param {string} lookType - one of the LOOK_* constants
 * @param {number} range - how large the area should be
 * @returns {any[]} - an area of things(that match the LOOK_*) found
 */
function check_area(room,target, lookType:string,range:number):any[]
{
    let top = target.pos.y - range;
    let bot = target.pos.y + range;
    let left = target.pos.x - range;
    let right = target.pos.x + range;
    let result = room.lookForAtArea(lookType,top,left,bot,right,true);
    return result;
}

/**
 * Determines if the creep should be recycled
 *If the creep should be recycled then this method also does that process
 * @param creep
 * @returns {boolean}False if creep isn't going to be recycled, true if the creep is being recycled
 */
function recycle(creep):boolean
{

    if(creep.memory.role == 'miner')//Don't recycle miners
    {
        //TODO spawn new creep to take over this one
    } else if(creep.ticksToLive < 350)
    {//recycle creep
        creep.say("recycle");
        //Find closest spawn

        //TODO Should probably move toward the closest spawn
        let target_spawn = Memory.lar[creep.room.name].spawns[0];

        if(creep.pos.inRangeTo(target_spawn,1))
        {//Recycle self
            creep.drop(RESOURCE_ENERGY);
            Game.spawns[target_spawn.name].recycleCreep(creep);
        } else// move toward it
            creep.moveTo(target_spawn);

        return true;
    }

    return false;
}

function gather_energy(creep):void
{//TODO increase efficiency
    if(creep.room.storage && creep.room.storage.store[RESOURCE_ENERGY] > 1000)
    {
        if(creep.withdraw(creep.room.storage,RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(creep.room.storage);
        }
        return;
    }

    let containers = Memory.lar[creep.room.name].buildings.filter(function (s) {
        return s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] > 0;
    });
    if(containers.length > 0)
    {
        //console.log(containers.e);
        containers = containers.sort(function(a,b){
            return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
        });

        let action_result = creep.withdraw(containers[0],RESOURCE_ENERGY);
        switch(action_result)
        {
            case ERR_NOT_IN_RANGE:creep.moveTo(containers[0]);
                break;
            case OK:
                break;
            default:creep.say(action_result);
        }
    }

    let d_source = chooseDropped(creep);
    if(d_source != null)
    {
        if(creep.pickup(d_source) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(d_source);
        }
        return;
    }

    let source = Game.getObjectById(creep.memory.source);
    if(creep.harvest(source) == ERR_NOT_IN_RANGE)
    {
        creep.moveTo(source);
        return;
    }
}

function chooseDropped(creep)
{
    let source = Game.getObjectById(creep.memory.source);

    //console.log(creep.memory.source);
    let dropped_source = Memory.lar[creep.room.name].droppedSource;
    let d_source = null;
    /*
    for(let i = 0; i < dropped_source.length; i++)
    {
        //TODO should be 'source.pos.findClosestByRange(dropped_source)'
        //  but source isn't distributed evenly yet.

        if(d_source.energy > (creep.carryCapacity - creep.carry))
            break;

        d_source = dropped_source[i];
    }
    */
    d_source = dropped_source[0];//creep.pos.findClosestByRange(dropped_source);

    return d_source;
}

