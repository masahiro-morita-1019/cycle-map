import type { Provider } from "./gbfs/types";
import {
  fetchHelloCyclingInformation,
  fetchHelloCyclingStatus,
} from "./gbfs/adapters/hellocycling";
import {
  fetchDocomoInformation,
  fetchDocomoStatus,
} from "./gbfs/adapters/docomo";

export const PROVIDERS: Provider[] = ["hellocycling", "docomo"];

export async function fetchInformation(provider: Provider) {
  switch (provider) {
    case "hellocycling":
      return fetchHelloCyclingInformation();
    case "docomo":
      return fetchDocomoInformation();
  }
}

export async function fetchStatus(provider: Provider) {
  switch (provider) {
    case "hellocycling":
      return fetchHelloCyclingStatus();
    case "docomo":
      return fetchDocomoStatus();
  }
}
