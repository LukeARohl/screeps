
export class Job{
    priority:number;
    siteId:string;
    command:any;
    creep:any;
    constructor(priority:number, siteId:string, command:any)
    {
        this.priority = priority;
        this.siteId = siteId;

        switch(command)
        {
            case 'pickup': this.command = job_pickup(siteId);
                break;
            case 'harvest': this.command = job_harvest(siteId);
                break;
            case 'refill':this.command = job_refill(siteId);
                break;
            case 'repair':this.command = job_repair(siteId);
                break;
            default:console.log(command);
                break;
        }

    }//End of constructor

    setCreep(creep)
    {
        this.creep = creep;
    }

    runCommand()
    {
        this.command(this.creep);
    }
};

function job_repair(id)
{
    var target = Game.getObjectById(id);

    return function(creep)
    {
        if(creep.repair(target) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(target);
        }
    }
}

function job_refill(id)
{
    var target = Game.getObjectById(id);

    return function(creep)
    {
        if(creep.transfer(target) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(target);
        }
    }
}

function job_pickup(id)
{
    var target = Game.getObjectById(id);

    return function(creep)
    {
        if(creep.pickup(target) == ERR_NOT_IN_RANGE)
        {
            creep.moveTo(target);
        }
    }
}

function job_harvest(resource_id)
{
    var target = Game.getObjectById(resource_id);

    return function(creep)
    {
        let harvest_result = creep.harvest(target) == ERR_NOT_IN_RANGE;
        switch(harvest_result)
        {
            case ERR_NOT_IN_RANGE: creep.moveTo(target);
                break;
            case OK://Do some jobs check logic
                break;
            default:
                console.log("Harvest Result: " + harvest_result);
        }

    }
}