import { container } from "tsyringe";
import ApiService from "@/app/infrastructures/services/ApiService";
import { %feature%ApiRepository } from "@/app/infrastructures/repositories/api/%feature%ApiRepository";
import { %feature%Mapper } from "@/data/persistences/mappers/%feature%Mapper";
import { %feature%Endpoint } from "@/app/infrastructures/endpoints/%feature%Endpoint";
import { %feature%Presenter } from "@/app/ui/presenters/%feature%Presenter";

export class %feature%Component {
  public static init() {
    container.register<%feature%ApiRepository>(
        %feature%ApiRepository,
      {
        useFactory: d => {
          return new %feature%ApiRepository(
            d.resolve(ApiService),
            d.resolve(%feature%Mapper),
            d.resolve(%feature%Endpoint)
          );
        }
      }
    );
    container.register<%feature%Mapper>(%feature%Mapper, {
      useClass: %feature%Mapper
    });
    container.register<%feature%Presenter>(
        %feature%Presenter,
      {
        useFactory: d => {
          return new %feature%Presenter(
            d.resolve(%feature%ApiRepository)
          );
        }
      }
    );
  }
}
