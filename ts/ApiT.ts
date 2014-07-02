module ApiT {
  /*
    The following type definitions were translated manually
    from wolverine/types/api.atd.
    We might want to generate them with atdgen in the future.
  */

  export interface Team {
    teamid: string;
    team_name: string;
    team_executive: string;
    team_assistants: string[];
  }

  export interface Phone {
    title: string;
    number: string;
  }

  export interface EmailEntry {
    title: string;
    email: string;
  }

  export interface FirstLastName {
    first: string;
    last: string;
  }

  export enum Role {
    Assistant,
    Executive
  }

  export enum Gender {
    Female,
    Male
  }

  export interface Profile {
    profile_uid: string;
    role: Role; // optional
    editable: boolean; // optional
    prefix: string; // optional
    first_last_name: FirstLastName; // optional
    pseudonym: string; // optional
    gender: Gender; // optional
    emails: EmailEntry[];
    phones: Phone[];
  }

  export interface LoginResponse {
    uid: string;
    api_secret: string;
    email: string;
    profile: Profile;
    teams: Team[];
  }
}
