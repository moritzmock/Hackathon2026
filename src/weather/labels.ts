// Words and icons for the weather, shared by the sidebar panel and the map sign.
import { Cloud, CloudRain, CloudSun, Leaf, Moon, Snowflake, Sprout, Sun } from "lucide-react";
import type { Season, Sky } from "./conditions";

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const SKY_ICON: Record<Sky, typeof Sun> = { sunny: Sun, "some sun": CloudSun, overcast: Cloud, rain: CloudRain, snow: Snowflake, night: Moon };
export const SEASON_ICON: Record<Season, typeof Sun> = { Spring: Sprout, Summer: Sun, Autumn: Leaf, Winter: Snowflake };
