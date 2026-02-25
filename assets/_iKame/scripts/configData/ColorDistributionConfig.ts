import { _decorator } from 'cc';
import { bh } from 'db://scriptable-asset/scriptable_runtime';
const { ccclass, property } = _decorator;

@ccclass('ColorDistribution')
export class ColorDistribution {
    @property({ range: [0, 11], slide: true, step: 1, type: Number })
    color: number = 0;

    @property({ range: [1, 20], slide: true, step: 1, type: Number })
    weight: number = 1;
}

@bh.createAssetMenu('ColorDistributionConfig', 'ScriptableAsset/ColorDistributionConfig')
@bh.scriptable('ColorDistributionConfig')
export class ColorDistributionConfig extends bh.ScriptableAsset {

    @property([ColorDistribution])
    colorDistributions: ColorDistribution[] = [];

    public getColors(totalStickers: number, seed: number = -1): number[] {
        const result: number[] = [];

        if (!this.colorDistributions || this.colorDistributions.length === 0) return result;

        // Seeded random via simple LCG; falls back to Math.random when seed == -1
        let s = seed;
        const random = seed !== -1
            ? () => {
                s = (Math.imul(s, 1664525) + 1013904223) | 0;
                return (s >>> 0) / 0xffffffff;
            }
            : Math.random.bind(Math);

        // 1. Calculate total weight
        let totalWeight = 0;
        for (const dist of this.colorDistributions) {
            totalWeight += dist.weight;
        }
        if (totalWeight <= 0) return result;

        // 2. Initial allocation — rounded to nearest multiple of 3, min 3
        const colorCounts = new Map<number, number>();
        let currentTotalCount = 0;

        for (const dist of this.colorDistributions) {
            const ratio = dist.weight / totalWeight;
            let targetCount = Math.round(totalStickers * ratio);

            const remainder = targetCount % 3;
            if (remainder === 1) targetCount -= 1;
            else if (remainder === 2) targetCount += 1;

            if (targetCount < 3) targetCount = 3;

            colorCounts.set(dist.color, targetCount);
            currentTotalCount += targetCount;
        }

        // 3. Adjust discrepancy in steps of 3
        let discrepancy = totalStickers - currentTotalCount;

        while (discrepancy !== 0) {
            if (Math.abs(discrepancy) < 3) break; // can't satisfy with % 3 constraint

            if (discrepancy > 0) {
                // Add 3 to most under-represented color
                let bestColor = -1;
                let maxDiff = -Infinity;

                for (const dist of this.colorDistributions) {
                    const current = colorCounts.get(dist.color)!;
                    const ideal = (dist.weight / totalWeight) * totalStickers;
                    const diff = ideal - current;
                    if (diff > maxDiff) { maxDiff = diff; bestColor = dist.color; }
                }

                const target = bestColor !== -1 ? bestColor : this.colorDistributions[0].color;
                colorCounts.set(target, colorCounts.get(target)! + 3);
                discrepancy -= 3;
            } else {
                // Remove 3 from most over-represented color (must stay >= 3)
                let bestColor = -1;
                let maxDiff = -Infinity;

                for (const dist of this.colorDistributions) {
                    const current = colorCounts.get(dist.color)!;
                    if (current <= 3) continue;
                    const ideal = (dist.weight / totalWeight) * totalStickers;
                    const diff = current - ideal;
                    if (diff > maxDiff) { maxDiff = diff; bestColor = dist.color; }
                }

                if (bestColor !== -1) {
                    colorCounts.set(bestColor, colorCounts.get(bestColor)! - 3);
                    discrepancy += 3;
                } else {
                    console.error('ColorDistributionConfig: totalStickers too small for the number of colors.');
                    break;
                }
            }
        }

        // 4. Build flat list
        for (const [color, count] of colorCounts) {
            for (let i = 0; i < count; i++) result.push(color);
        }

        // 5. Fisher-Yates shuffle
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            const tmp = result[i];
            result[i] = result[j];
            result[j] = tmp;
        }

        return result;
    }
}


