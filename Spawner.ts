//Imports
var _ = require('lodash');

import {Designer} from "./Designer";
import {Util} from "./Util";



export class Spawner{
    util: Util;
    designer: Designer = new Designer();
    constructor()
    {
        this.util = new Util();
    }

    run(spawn)
    {
        if(spawn.spawning)
        {
            let spawningCreep = Game.creeps[spawn.spawning.name];
            spawn.room.visual.text(
                '🛠️' + spawningCreep.memory.role,
                spawn.pos.x - 3,
                spawn.pos.y + 1,
                {align: 'left', opacity: 0.8});
            return;
        }

        if(Memory.lar[spawn.room.name].creeps.length == 0)
        {
            this.createCreep(spawn,'harvester',true);
            return;
        }

        switch(spawn.room.controller.level)
        {
            case 1:
                this.controller_level_1(spawn);
                break;
            case 2:
                this.controller_level_2(spawn);
                break;
            case 3:
                this.controller_level_3(spawn);
                break;
            case 4:
                this.controller_level_4(spawn);
                break;
            case 5:
                this.controller_level_4(spawn);
                break;
            default:
                this.controller_level_4(spawn);
                break;
        }
    }

    private controller_level_1(spawn)
    {
        if(this.util.get_harvesters(spawn).length < 2){
            this.createCreep(spawn,"harvester");
        }else if(this.util.get_upgraders(spawn).length < 4){
            this.createCreep(spawn,"upgrader");
        }
    }

    private controller_level_2(spawn)
    {
        if(this.util.get_miners(spawn).length < Memory.lar[spawn.room.name].sources.length
            && this.util.get_miners(spawn).length <= this.util.get_haulers(spawn).length){
            this.createCreep(spawn,"miner");
        }else if(this.util.get_haulers(spawn).length < 2){
            this.createCreep(spawn,"hauler");
        }else if(this.util.get_upgraders(spawn).length < 4){
            this.createCreep(spawn,"upgrader");
        }else if(this.util.get_builders(spawn).length < 3){
            this.createCreep(spawn,"builder");
        }
    }

    private controller_level_3(spawn)
    {
        if(this.util.get_miners(spawn).length < Memory.lar[spawn.room.name].sources.length
            && this.util.get_miners(spawn).length <= this.util.get_haulers(spawn).length){
            this.createCreep(spawn,"miner");
        }else if(this.util.get_haulers(spawn).length < 3){
            this.createCreep(spawn,"hauler");
        }else if(this.util.get_upgraders(spawn).length < 3){
            this.createCreep(spawn,"upgrader");
        }else if(this.util.get_builders(spawn).length < 3){
            this.createCreep(spawn,"builder");
        }
    }

    private controller_level_4(spawn)
    {

        if(this.util.get_miners(spawn).length < Memory.lar[spawn.room.name].sources.length
            && this.util.get_miners(spawn).length <= this.util.get_haulers(spawn).length){
            this.createCreep(spawn,"miner");
        }else if(this.util.get_haulers(spawn).length < Memory.lar[spawn.room.name].sources.length+1
            /* && this.util.get_haulers(spawn).length <= this.util.get_dispensers(spawn).length */){
            this.createCreep(spawn,"hauler");
        }else /* if(this.util.get_dispensers(spawn).length < 2 && spawn.room.storage)
        {
            if(this.util.get_dispensers(spawn).length == 0)
                this.createCreep(spawn,"dispenser",true);
            else
                this.createCreep(spawn,"dispenser");
        }else */ if(this.util.get_upgraders(spawn).length < 3){
            this.createCreep(spawn,"upgrader");
        }else if(this.util.get_builders(spawn).length < 2){
            this.createCreep(spawn,"builder");
        }
    }

    private createCreep(spawn,givenRole,force = false)
    {
        let body = this.designer.designCreep(spawn.room,givenRole,force);
        let action_result = spawn.spawnCreep(body, givenRole + Game.time, {
            memory: {role: givenRole, source:""}
        });
    }
}