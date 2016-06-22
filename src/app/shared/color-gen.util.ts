export class RandomColorGen {
  private GOLDEN_RATIO_CONJUGATE = 0.618033988749895;

  private colorCache: number[] = [];
  private varietyComparator: number; 

  /** Higher range = more unique colors, less individual contrast */
  constructor(range: number) {
    this.varietyComparator = 1 / 24;
  }

  /** Generate a random, evenly distributed RGB Hex color */
  randomColor(): string {
    let h;
    if (this.colorCache.length < 25 && this.colorCache.length > 0) {
      let foundHue = false;
      while (!foundHue) {
        h = Math.random();
        let duplicateHue = false;
        this.colorCache.forEach(color => {
          if (Math.abs(color - h) < this.varietyComparator) {
            duplicateHue = true;
          }
        });
        if (!duplicateHue) foundHue = true;
      }
    } else h = Math.random(); // Fall back on duplicate hues after 24 or generate first
    this.colorCache.push(h);
    h += this.GOLDEN_RATIO_CONJUGATE;
    h %= 1;
    return this.hslToRgb(h, 0.6, 0.60);
  }

  private hslToRgb(h, s, l) {
      let r, g, b;
      if(s == 0){
          r = g = b = l; // achromatic
      } else {
          function hue2rgb(p, q, t){
              if(t < 0) t += 1;
              if(t > 1) t -= 1;
              if(t < 1/6) return p + (q - p) * 6 * t;
              if(t < 1/2) return q;
              if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
              return p;
          }
          var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          var p = 2 * l - q;
          r = hue2rgb(p, q, h + 1/3);
          g = hue2rgb(p, q, h);
          b = hue2rgb(p, q, h - 1/3);
      }
      return '#'+Math.round(r * 255).toString(16)+Math.round(g * 255).toString(16)+Math.round(b * 255).toString(16);
 }

}
  