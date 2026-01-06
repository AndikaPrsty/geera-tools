import { %feature%Component } from "@/app/infrastructures/dependencies/modules/%feature%Component";
import store from "@/store";
import { container } from "tsyringe";
import { getModule, Module, VuexModule } from "vuex-module-decorators";
import { %feature%Presenter } from "../presenters/%feature%Presenter";
%feature%Component.init();

@Module({
    namespaced: true,
    dynamic: true,
    store,
    name: "%feature%"
})
class %feature%Store extends VuexModule {

}


export const %feature%Controller = getModule(%feature%Store);

