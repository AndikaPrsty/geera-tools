import { %feature%ApiRepository } from "@/app/infrastructures/repositories/api/%feature%ApiRepository";
import { injectable } from "tsyringe";

@injectable()
export class %feature%Presenter {
  private repository: %feature%ApiRepository;

  constructor(repository: %feature%ApiRepository) {
    this.repository = repository;
  }
}
