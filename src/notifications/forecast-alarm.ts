
export abstract class ForecastAlarmsBuilder {

}

export type ForecastAlarm = {
    type: ForecastAlarmType
    level: ForecastAlarmLevel
    icon: ForecastIconId
    summary?: string
    startTime: number
}

export type ForecastIconId = number

// export enum ForecastAlarmPeriod {
//     ALL_DAY = 'ALL_DAY',
//     MORNING = 'MORNING',

// }

export enum ForecastAlarmLevel {
    YELLOW = 'YELLOW',
    ORANGE = 'ORANGE',
    RED = 'RED',
}

export enum ForecastAlarmType {
    WIND = 'WIND',
    SNOW = 'SNOW',
    THUNDERSTORM = 'THUNDERSTORM',
    FOG = 'FOG',
    HIGH_TEMP = 'HIGH_TEMP',
    LOW_TEMP = 'LOW_TEMP',
    COASTAL_EVENT = 'COASTAL_EVENT',
    FORESTFIRE = 'FORESTFIRE',
    AVALANCHES = 'AVALANCHES',
    RAIN = 'RAIN',
    FLOOD = 'FLOOD',
    RAIN_FLOON = 'RAIN_FLOON',
}
