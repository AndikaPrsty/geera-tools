import { %feature%Mapper } from "@/data/persistences/mappers/%feature%Mapper";
import { %feature%RepositoryInterface } from "@/data/persistences/repositories/contracts/%feature%RepositoryInterface";
import { %feature%Endpoint } from "@/app/infrastructures/endpoints/%feature%Endpoint";
import ApiService from "@/app/infrastructures/services/ApiService";

export class %feature%ApiRepository implements %feature%RepositoryInterface {
  private service: ApiService;
  private mapper: %feature%Mapper;
  private endpoints: %feature%Endpoint;

  constructor(service: ApiService, mapper: %feature%Mapper, endpoints: %feature%Endpoint) {
    this.service = service;
    this.mapper = mapper;
    this.endpoints = endpoints;
  }
}

