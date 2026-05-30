import { logger } from '../../../logger/index.ts';
import * as githubHttp from '../../../util/http/github.ts';
import type { EmailAddress } from '../../../util/schema-utils/index.ts';
import { GithubUserDetailsSchema, GithubUserEmailsSchema } from './schema.ts';
import type { UserDetails } from './types.ts';

const githubApi = new githubHttp.GithubHttp();

export async function getAppDetails(token: string): Promise<UserDetails> {
  try {
    // set count to one bypass graphql check
    const appData = await githubApi.requestGraphql<{
      viewer: {
        // https://docs.github.com/en/graphql/reference/objects#user
        login: string;
        databaseId: number;
      };
    }>('query { viewer { login databaseId }}', { token, count: 1 });
    if (!appData?.data) {
      throw new Error("Init: Can't get App details");
    }
    return {
      username: appData.data.viewer.login,
      name: appData.data.viewer.login,
      id: appData.data.viewer.databaseId,
      // When using the GraphQL API, email requires a token with user:email scope
      email: null,
    };
  } catch (err) {
    logger.debug({ err }, 'Error authenticating with GitHub');
    throw new Error('Init: Authentication failure');
  }
}

export async function getUserDetails(
  endpoint: string,
  token: string,
): Promise<UserDetails> {
  try {
    // https://docs.github.com/en/rest/users/users
    const userData = (
      await githubApi.getJson(
        `${endpoint}user`,
        { token },
        GithubUserDetailsSchema,
      )
    ).body;
    return {
      username: userData.login,
      // When name is absent from API, preserve undefined-like value (existing behavior)
      name: userData.name!,
      id: userData.id,
      email: userData.email as EmailAddress | null,
    };
  } catch (err) {
    logger.debug({ err }, 'Error authenticating with GitHub');
    throw new Error('Init: Authentication failure');
  }
}

export async function getUserEmail(
  endpoint: string,
  token: string,
): Promise<EmailAddress | null> {
  try {
    const emails = (
      await githubApi.getJson(
        `${endpoint}user/emails`,
        { token },
        GithubUserEmailsSchema,
      )
    ).body;
    return (emails?.[0]?.email as EmailAddress | undefined) ?? null;
  } catch {
    logger.debug(
      'Cannot read user/emails endpoint on GitHub to retrieve gitAuthor',
    );
    return null;
  }
}
