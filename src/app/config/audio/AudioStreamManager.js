"use client"

class AudioStreamManager {
    constructor() {
        this.audioContext = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.audioBuffer = null;
        this.currentChunkIndex = 0;
        this.chunks = [];
        this.isLoading = false;
        this.duration = 0;
        this.startTime = 0;
        this.isPlaying = false;
        this.onTimeUpdate = null;
        this.onEnded = null;
        this.onError = null;
        this.timeUpdateInterval = null;
    }

    async initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
        }
        return this.audioContext;
    }

    async loadChunk(chunkId) {
        try {
            const response = await fetch(`https://gateway.irys.xyz/${chunkId}`);
            if (!response.ok) throw new Error('Failed to fetch chunk');
            const arrayBuffer = await response.arrayBuffer();
            return arrayBuffer;
        } catch (error) {
            console.error(`Error loading chunk ${chunkId}:`, error);
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    async concatenateChunks(chunks) {
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
            result.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
        }
        
        return result.buffer;
    }

    async preloadChunks(chunkIds) {
        try {
            await this.initAudioContext();
            this.isLoading = true;
            const chunkPromises = chunkIds.map(id => this.loadChunk(id));
            const loadedChunks = await Promise.all(chunkPromises);
            const completeAudioBuffer = await this.concatenateChunks(loadedChunks);
            
            this.audioBuffer = await this.audioContext.decodeAudioData(completeAudioBuffer);
            this.duration = this.audioBuffer.duration;
            this.isLoading = false;
            
            return this.audioBuffer;
        } catch (error) {
            this.isLoading = false;
            console.error('Error preloading chunks:', error);
            if (this.onError) this.onError(error);
            throw error;
        }
    }

    startTimeTracking() {
        this.stopTimeTracking();
        this.timeUpdateInterval = setInterval(() => {
            if (this.isPlaying && this.onTimeUpdate) {
                const currentTime = this.getCurrentTime();
                this.onTimeUpdate(currentTime);

                // Check if playback has ended
                if (currentTime >= this.duration) {
                    this.handlePlaybackEnd();
                }
            }
        }, 100); // Update every 100ms
    }

    stopTimeTracking() {
        if (this.timeUpdateInterval) {
            clearInterval(this.timeUpdateInterval);
            this.timeUpdateInterval = null;
        }
    }

    getCurrentTime() {
        if (!this.isPlaying || !this.startTime) return 0;
        return this.audioContext.currentTime - this.startTime;
    }

    async play(startTime = 0) {
        if (!this.audioBuffer) return;

        try {
            await this.initAudioContext();

            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }

            if (this.sourceNode) {
                this.sourceNode.stop();
                this.sourceNode.disconnect();
            }

            this.sourceNode = this.audioContext.createBufferSource();
            this.sourceNode.buffer = this.audioBuffer;
            this.sourceNode.connect(this.gainNode);
            
            this.sourceNode.onended = () => this.handlePlaybackEnd();

            this.startTime = this.audioContext.currentTime - startTime;
            this.sourceNode.start(0, startTime);
            this.isPlaying = true;
            
            this.startTimeTracking();
        } catch (error) {
            console.error('Error starting playback:', error);
            if (this.onError) this.onError(error);
        }
    }

    handlePlaybackEnd() {
        this.isPlaying = false;
        this.stopTimeTracking();
        if (this.onEnded) this.onEnded();
    }

    pause() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this.isPlaying = false;
        this.stopTimeTracking();
    }

    setVolume(volume) {
        if (this.gainNode) {
            const clampedVolume = Math.max(0, Math.min(1, volume));
            this.gainNode.gain.value = clampedVolume;
        }
    }

    seek(time) {
        const clampedTime = Math.max(0, Math.min(time, this.duration));
        if (this.isPlaying) {
            this.play(clampedTime);
        }
    }

    cleanup() {
        this.pause();
        this.stopTimeTracking();
        if (this.gainNode) {
            this.gainNode.disconnect();
        }
        this.audioBuffer = null;
        this.currentChunkIndex = 0;
        this.chunks = [];
        this.startTime = 0;
        this.isPlaying = false;
    }
}

export default AudioStreamManager;