// Linear connector integration (see .local/skills/integrations). Files beta
// feedback / bug reports as issues in Linear so they land in a real triage
// queue as volume grows, instead of only a shared inbox + manual markdown
// table (see ROLLOUT_STATUS.md). Uses the Replit connector proxy — no manual
// API key required.
import { ReplitConnectors } from "@replit/connectors-sdk";
import { logger } from "./logger";

const connectors = new ReplitConnectors();

let cachedTeamId: string | null = null;

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

async function linearGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await connectors.proxy("linear", "/graphql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Linear API request failed with status ${response.status}`);
  }

  const json = (await response.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length > 0) {
    throw new Error(`Linear API error: ${json.errors.map((e) => e.message).join("; ")}`);
  }
  if (!json.data) {
    throw new Error("Linear API returned no data");
  }
  return json.data;
}

async function getFeedbackTeamId(): Promise<string> {
  if (cachedTeamId) {
    return cachedTeamId;
  }

  const data = await linearGraphQL<{
    teams: { nodes: Array<{ id: string; key: string; name: string }> };
  }>(`query { teams { nodes { id key name } } }`);

  const teams = data.teams.nodes;
  if (teams.length === 0) {
    throw new Error("No Linear teams are available to file feedback against");
  }

  const configuredKey = process.env.LINEAR_FEEDBACK_TEAM_KEY;
  const team = configuredKey
    ? teams.find((t) => t.key === configuredKey)
    : teams[0];

  if (!team) {
    throw new Error(
      `LINEAR_FEEDBACK_TEAM_KEY "${configuredKey}" did not match any Linear team`,
    );
  }

  cachedTeamId = team.id;
  return team.id;
}

export interface FeedbackInput {
  userId: string;
  message: string;
  platform?: string;
  appVersion?: string;
  deviceInfo?: string;
}

export interface CreatedIssue {
  id: string;
  identifier: string;
  url: string;
}

/**
 * Files a beta feedback report as a Linear issue. Throws on any failure —
 * callers should treat that as "structured path failed" and let the client
 * fall back to its mailto: path.
 */
export async function createFeedbackIssue(
  input: FeedbackInput,
): Promise<CreatedIssue> {
  const teamId = await getFeedbackTeamId();

  const firstLine = input.message.split("\n")[0]?.trim() ?? input.message;
  const title = `[Beta feedback] ${firstLine.slice(0, 80)}`;

  const descriptionLines = [
    input.message,
    "",
    "---",
    `Reported by user: ${input.userId}`,
    input.platform ? `Platform: ${input.platform}` : null,
    input.appVersion ? `App version: ${input.appVersion}` : null,
    input.deviceInfo ? `Device: ${input.deviceInfo}` : null,
    `Reported at: ${new Date().toISOString()}`,
  ].filter((line): line is string => line !== null);

  const data = await linearGraphQL<{
    issueCreate: {
      success: boolean;
      issue: { id: string; identifier: string; url: string } | null;
    };
  }>(
    `mutation CreateFeedbackIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }`,
    {
      input: {
        teamId,
        title,
        description: descriptionLines.join("\n"),
      },
    },
  );

  if (!data.issueCreate.success || !data.issueCreate.issue) {
    throw new Error("Linear issueCreate mutation reported failure");
  }

  logger.info(
    { issueIdentifier: data.issueCreate.issue.identifier },
    "Filed beta feedback as a Linear issue",
  );

  return data.issueCreate.issue;
}
