// Types for grid coordinates
interface Point {
    x: number;
    y: number;
}

// Configuration Constants
const TARGET_TILE_COUNT: number = 2000;
const GLOW_COLOR: string = "#00f2ff";

class MosaicProject {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private grid: Point[] = [];
    private foundImages: HTMLImageElement[] = [];
    private modeDisplay: HTMLElement | null;
    private countDisplay: HTMLElement | null;
    private tileSize: number = 0;

    constructor() {
        this.canvas = document.getElementById('mosaicCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.modeDisplay = document.getElementById('mode');
        this.countDisplay = document.getElementById('count');

        if (!this.canvas) return;
        this.init();
    }

    private init(): void {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const screenArea = this.canvas.width * this.canvas.height;
        this.tileSize = Math.sqrt(screenArea / TARGET_TILE_COUNT);

        for (let y = 0; y < this.canvas.height; y += this.tileSize) {
            for (let x = 0; x < this.canvas.width; x += this.tileSize) {
                if (this.grid.length < TARGET_TILE_COUNT) {
                    this.grid.push({ x, y });
                } else break;
            }
            if (this.grid.length >= TARGET_TILE_COUNT) break;
        }
        this.scanAssets(1);
    }

    private scanAssets(num: number): void {
        const img = new Image();
        img.src = `${num}.jpg`; 
        img.onload = () => {
            this.foundImages.push(img);
            if (this.foundImages.length < this.grid.length) {
                this.scanAssets(num + 1);
            } else this.startRendering();
        };
        img.onerror = () => this.startRendering();
    }

    private async startRendering(): Promise<void> {
        const total = this.foundImages.length;
        if (total === 0) return;

        for (let i = 0; i < total; i++) {
            const isLatest = (i === total - 1);
            const pos = this.grid[i];
            const img = this.foundImages[i];

            if (isLatest) {
                this.updateUI("Update Received", i + 1);
                await this.glowUp(img, pos);
            } else {
                // CHANGED: Use quickFade instead of drawInstant
                await this.quickFade(img, pos);
                
                if (i % 5 === 0) {
                    this.updateUI("Reconstructing", i + 1);
                }
            }
        }
        this.updateUI("Standby", total);
    }

    // New logic for a smooth, visible fade
    private quickFade(img: HTMLImageElement, pos: Point): Promise<void> {
        return new Promise((resolve) => {
            let opacity = 0;
            const speed = 0.08; // Adjust this to make the history fade slower or faster

            const step = () => {
                opacity += speed;
                this.ctx.globalAlpha = opacity;
                
                this.ctx.clearRect(pos.x, pos.y, this.tileSize, this.tileSize);
                this.ctx.drawImage(img, pos.x, pos.y, this.tileSize, this.tileSize);
                
                if (opacity < 1) {
                    requestAnimationFrame(step);
                } else {
                    this.ctx.globalAlpha = 1.0; // Reset for safety
                    resolve();
                }
            };
            step();
        });
    }

    private glowUp(img: HTMLImageElement, pos: Point): Promise<void> {
        return new Promise((resolve) => {
            let opacity = 0;
            let glow = 0;
            
            const step = () => {
                opacity += 0.03; 
                glow += 1.2;
                
                this.ctx.save(); // Save state to contain the glow
                this.ctx.globalAlpha = opacity;
                this.ctx.shadowBlur = glow;
                this.ctx.shadowColor = GLOW_COLOR;
                
                const pulseScale = 1.15 - (0.15 * opacity);
                const currentSize = this.tileSize * pulseScale;
                const offset = (currentSize - this.tileSize) / 2;
                
                this.ctx.clearRect(pos.x - 5, pos.y - 5, this.tileSize + 10, this.tileSize + 10);
                this.ctx.drawImage(img, pos.x - offset, pos.y - offset, currentSize, currentSize);
                
                this.ctx.restore(); // Restore state (clears shadowBlur for next draw)
                
                if (opacity < 1) {
                    requestAnimationFrame(step);
                } else {
                    resolve();
                }
            };
            step();
        });
    }

    private updateUI(mode: string, count: number): void {
        if (this.modeDisplay) this.modeDisplay.innerText = mode;
        if (this.countDisplay) {
            // Updated to show Goal: X / 2000
            this.countDisplay.innerText = `${count} / ${TARGET_TILE_COUNT}`;
        }
    }
}

export const GridComponent = () => {
    setTimeout(() => { new MosaicProject(); }, 0);

    return `
    <div id="bg-image"></div>
    <!--
    <div id="status-plate">
        <span id="mode" style="display:none"></span>
        Goal: <span id="count">0</span>
    </div>
    -->
    <canvas id="mosaicCanvas"></canvas>`;
}

export default GridComponent;