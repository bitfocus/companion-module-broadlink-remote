import { InstanceBase, runEntrypoint, InstanceStatus, combineRgb } from '@companion-module/base'
import { upgradeScripts } from './upgrade.js'
import { setupActions } from './actions.js'
import { configFields } from './config.js'

import * as broadlink from 'node-broadlink'
import { Rm4pro } from 'node-broadlink'
import { variables } from './variables.js';

var rmdevice;
var devices;

class Rm4ProInstance extends InstanceBase {
	isInitialized = false
	async init(config) {
		this.config = config

		this.connectToRmDevice();

		this.isInitialized = true

		this.updateStatus(InstanceStatus.Ok);
		this.initActions()
		this.initFeedbacks()
		this.setVariableDefinitions(variables);
	}

	async connectToRmDevice() {
		devices = await broadlink.discover();
		if (devices.length > 0) {
			var device = devices[0];

			rmdevice = new Rm4pro(device.host, device.mac, device.deviceType, device.model, device.manufacturer, device.name, device.isLocked);
			await rmdevice.auth();
			this.updateStatus(InstanceStatus.Ok);
			return true;
		}
		this.updateStatus(InstanceStatus.ConnectionFailure, "No device found");
		return false;
	}

	async wait(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async sweepRFandFindCode() {
		let frequencyFound = false;
		console.log("RF Learn: Long press the button of the remote to scan for the correct RF frequency.")
		await rmdevice.sweepFrequency();
		while (!frequencyFound) {
			frequencyFound = await rmdevice.checkFrequency();
		}

		console.log("RF Learn: Frequency found, delay for 1 second...");
		await this.wait(1000);
		console.log("RF Learn: Press the button once again (short press) within the next 3 seconds to retreive the code.")

		let rfPacketFound = false;
		await rmdevice.findRfPacket();
		await this.wait(3000);
		rfPacketFound = await rmdevice.checkData();


		if (rfPacketFound) {
			console.log("RF Learn: Success! The code was recorded and can now be sent out.")
			return rfPacketFound;
		} else {
			console.log("RF Learn: Timeout - no command received.");
		}
	}

	async learnRFCode(customVar) {
		var code = await this.sweepRFandFindCode();
		return code.toString("hex");
	}

	async learnIRCode() {
		await rmdevice.enterLearning();
		var code = "";
		var codeFound = false;

		const timeout = 10000;
		const startTime = Date.now();

		console.info("IR Learn: Please now point the remote to the device and press the button, till the LED indicator turns off.")

		while (!codeFound) {
			try {
				code = await rmdevice.checkData();
				this.setVariableValues({
					lastIRCode: code.toString("hex")
				});
				console.info("IR Learn: Success! The code was recorded and can now be sent out.")
				return code.toString("hex");
			} catch {
				codeFound = false;
			}

			if (Date.now() - startTime >= timeout) {
				console.info("IR Learn: Timeout - no command received in the last " + timeout / 1000 + " seconds.");
				break;
			}
		}
	}

	async sendCode(code) {
		var parsedCode = await this.parseVariablesInString(code);
		await rmdevice.sendData(parsedCode);
	}

	async destroy() {
		this.isInitialized = false
	}

	async configUpdated(config) {
		this.config = config
	}

	getConfigFields() {
		return configFields;
	}

	initFeedbacks() {
		this.setFeedbackDefinitions([]);
	}

	initActions() {
		setupActions(this);
	}
}

runEntrypoint(Rm4ProInstance, upgradeScripts)