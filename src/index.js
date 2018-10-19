import Swagger from 'swagger-client';

export const definitionsFromJson = definitions => {
  return 'here we parse the defs and make some proptype structure';
};

export const definitionsFromUrl = async url => {
  const response = await Swagger.http({ url });
  return definitionsFromJson(response.body.definitions);
};
