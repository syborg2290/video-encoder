/*
 * Video and audio encoder for encoding video and audio
 */

// Dependencies
const { parentPort, workerData } = require('worker_threads');

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const log = require('./log');
const constants = require('./constants');

async function encode() {
  const encodingInstructions = workerData;
  const startTime = Date.now();
  const inputAsset = path.join(encodingInstructions.inputFolder, encodingInstructions.inputAsset);
  const outputAsset = path.join(encodingInstructions.outputFolder, encodingInstructions.outputAsset);
  log.debug(`input: ${inputAsset}`);
  log.debug(`output: ${outputAsset}`);

  if (encodingInstructions.videoEncoder === constants.ENCODER_TYPES.X265) {
    const ffmpegCommand = ffmpeg()
      .input(inputAsset)
      .videoBitrate(encodingInstructions.videoBitrate)
      .videoCodec(encodingInstructions.videoEncoder)
      .size(encodingInstructions.videoSize)
      .audioCodec(encodingInstructions.audioEncoder)
      .audioBitrate(encodingInstructions.audioBitrate)
      .audioFrequency(encodingInstructions.audioFrequency)
      .withOutputOptions('-force_key_frames "expr:gte(t,n_forced*2)"')
      .outputOption('-x265-params keyint=48:min-keyint=48:scenecut=0:ref=5:bframes=3:b-adapt=2')
      .on('progress', (info) => {
        const message = {};
        message.type = constants.WORKER_MESSAGE_TYPES.PROGRESS;
        message.message = `Encoding: ${Math.round(info.percent)}%`;
        parentPort.postMessage(message);
      })
      .on('end', () => {
        const message = {};
        message.type = constants.WORKER_MESSAGE_TYPES.DONE;
        const endTime = Date.now();
        message.message = `Encoding finished after ${(endTime - startTime) / 1000} s`;
        parentPort.postMessage(message);
      })
      .on('error', (err, stdout, stderr) => {
        const message = {};
        message.type = constants.WORKER_MESSAGE_TYPES.ERROR;
        message.message = `An error occurred during encoding. ${err.message}`;
        parentPort.postMessage(message);

        log.error(`Error: ${err.message}`);
        log.error(`ffmpeg output: ${stdout}`);
        log.error(`ffmpeg stderr: ${stderr}`);
      })
      .save(outputAsset);

    parentPort.on('message', (message) => {
      if (message.type === constants.WORKER_MESSAGE_TYPES.STOP_ENCODING) {
        // Main thread asks to kill this thread.
        log.info('Main thread asked to stop this thread');
        ffmpegCommand.kill();
      }
    });
  } else if (encodingInstructions.videoEncoder === constants.ENCODER_TYPES.VP9) {
    ffmpeg()
      .input(inputAsset)
      .videoBitrate(encodingInstructions.videoBitrate)
      .videoCodec(encodingInstructions.videoEncoder)
      .size(encodingInstructions.videoSize)
      .audioCodec(encodingInstructions.audioEncoder)
      .audioBitrate(encodingInstructions.audioBitrate)
      .audioFrequency(encodingInstructions.audioFrequency)
      .outputOption(
        '-crf 23 -keyint_min 48 -g 48 -t 60 -threads 8 -speed 4 -tile-columns 4 -auto-alt-ref 1 -lag-in-frames 25 -frame-parallel 1 -af "channelmap=channel_layout=5.1"',
      )
      .on('progress', (info) => {
        log.info(`Encoding: ${info.percent}`);
      })
      .on('end', () => {
        const endTime = Date.now();
        log.info(`Encoding finished after ${(endTime - startTime) / 1000} s`);
      })
      .on('error', (err, stdout, stderr) => {
        log.error(`Error: ${err.message}`);
        log.error(`ffmpeg output:\n${stdout}`);
        log.error(`ffmpeg stderr:\n${stderr}`);
        log.error(`An error occurred during encoding. ${err.message}`);
      })
      .save(outputAsset);
  } else if (encodingInstructions.videoEncoder === constants.ENCODER_TYPES.X264) {
    ffmpeg()
      .input(inputAsset)
      .videoBitrate(encodingInstructions.videoBitrate)
      .videoCodec(encodingInstructions.videoEncoder)
      .size(encodingInstructions.videoSize)
      .audioCodec(encodingInstructions.audioEncoder)
      .audioBitrate(encodingInstructions.audioBitrate)
      .audioFrequency(encodingInstructions.audioFrequency)
      .withOutputOptions('-crf 23 -force_key_frames "expr:gte(t,n_forced*2)"')
      .outputOption('-g 48 -keyint_min 48 -sc_threshold 0 -bf 3 -b_strategy 2 -refs 5')
      .on('progress', (info) => {
        const message = {};
        message.type = constants.WORKER_MESSAGE_TYPES.PROGRESS;
        message.message = `Encoding: ${Math.round(info.percent)}%`;
        parentPort.postMessage(message);
      })
      .on('end', () => {
        const message = {};
        message.type = constants.WORKER_MESSAGE_TYPES.DONE;
        const endTime = Date.now();
        message.message = `Encoding finished after ${(endTime - startTime) / 1000} s`;
        parentPort.postMessage(message);
      })
      .on('error', (err, stdout, stderr) => {
        const message = {};
        message.type = constants.WORKER_MESSAGE_TYPES.ERROR;
        message.message = `An error occurred during encoding. ${err.message}`;
        parentPort.postMessage(message);

        log.error(`Error: ${err.message}`);
        log.error(`ffmpeg output: ${stdout}`);
        log.error(`ffmpeg stderr: ${stderr}`);
      })
      .save(outputAsset);
  }
}

encode();
