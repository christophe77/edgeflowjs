export type DeviceNetworkChangedEvent = { type: "device.network.changed"; online: boolean; kind?: string };
export type DeviceSerialReceivedEvent = { type: "device.serial.received"; port: string; data: string };
export type DeviceGpioEdgeEvent = { type: "device.gpio.edge"; pin: number; value: boolean };

export type DeviceEvent = DeviceNetworkChangedEvent | DeviceSerialReceivedEvent | DeviceGpioEdgeEvent;
