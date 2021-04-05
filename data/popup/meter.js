const SMOOTHING_FACTOR = 0.8;

registerProcessor('vumeter', class extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.volume = 0;
    const interval = options.processorOptions?.interval || 100;
    this.updateIntervalInMS = interval;
    this.nextUpdateFrame = interval;
  }
  get intervalInFrames() {
    return this.updateIntervalInMS / 1000 * sampleRate;
  }
  process(inputs) { // gets called for each block of 128 sample-frames
    const channels = inputs[0];

    // if no inputs are connected then zero channels will be passed in.
    if (channels.length > 0) {
      const rmss = [];
      for (const channel of channels) {
        const sum = channel.reduce((p, c) => p + (c * c), 0);
        // Calculate the RMS level and update the volume
        const rms = Math.sqrt(sum) / channel.length;
        rmss.push(rms);
      }
      const rms = rmss.reduce((p, c) => p + c, 0) / rmss.length;

      this.volume = Math.max(rms, this.volume * SMOOTHING_FACTOR);

      // Update and sync the volume property with the main thread.
      this.nextUpdateFrame -= channels[0].length;
      if (this.nextUpdateFrame < 0) {
        this.nextUpdateFrame += this.intervalInFrames;
        this.port.postMessage({
          volume: this.volume
        });
      }
    }
    return true;
  }
});
