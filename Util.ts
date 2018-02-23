


export class Util{

    setPath(creep,destination,opts)
    {
        if(!creep.memory.hasOwnProperty("path") || creep.memory.path.length == 0)
        {
            let origin = creep.pos;
            let goal = destination.pos;

            opts.serialize = true;
            let tempPath = creep.room.findPath(origin,goal,opts);
            creep.memory.path = tempPath;
        }
    }

    setTarget(creep,target){
        creep.memory.target = target.id;
    }

    hasTarget(creep)
    {
        return creep.memory.hasOwnProperty("target") && creep.memory.target.length != 0;
    }


    get_harvesters(spawn)
    {
        return Memory.lar[spawn.room.name].creeps.filter(function(c){
            return c.memory.role == 'harvester';
        });
    }

    get_upgraders(spawn)
    {
        return Memory.lar[spawn.room.name].creeps.filter(function(c){
            return c.memory.role == 'upgrader';
        });
    }

    get_builders(spawn)
    {
        return Memory.lar[spawn.room.name].creeps.filter(function(c){
            return c.memory.role == 'builder';
        });
    }

    get_haulers(spawn)
    {
        return Memory.lar[spawn.room.name].creeps.filter(function(c){
            return c.memory.role == 'hauler';
        });
    }

    get_miners(spawn)
    {
        return Memory.lar[spawn.room.name].creeps.filter(function(c){
            return c.memory.role == 'miner';
        });
    }

    get_dispensers(spawn)
    {
        return Memory.lar[spawn.room.name].creeps.filter(function(c){
            return c.memory.role == 'dispenser';
        });
    }
};