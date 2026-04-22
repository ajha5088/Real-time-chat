import neo4j from 'neo4j-driver';
import { env } from '../config/env.js';

export const neo4jDriver = neo4j.driver(
  env.neo4j.uri,
  neo4j.auth.basic(env.neo4j.username, env.neo4j.password)
);

export const initNeo4j = async () => {
  const session = neo4jDriver.session();
  try {
    await session.run('RETURN 1 AS ok');
  } finally {
    await session.close();
  }
};