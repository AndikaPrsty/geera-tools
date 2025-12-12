import { %feature%Component } from "@/app/infrastructures/dependencies/modules/%feature%Component";
import store from "@/store";
import { container } from "tsyringe";
import { etModule, Module, VuexModule } from "vuex-module-decorators";
import { %feature%Presenter } from "../presenters/%feature%Presenter";
import { %feature%Controller } from "./%feature%Controller";
%feature%Component.init();

@Module({
    namespaced: true,
    dynamic: true,
    store,
    name: "%feature%"
})
class %feature%store extends VuexModule implements %feature%state {

}


export const %feature%Controller = getModule(%feature%Store);

