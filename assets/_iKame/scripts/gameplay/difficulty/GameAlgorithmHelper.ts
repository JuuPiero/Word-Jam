/**
 * Helper class chứa thuật toán tính toán target id tiếp theo cho game.
 * Class này được tách riêng để dễ test và không phụ thuộc vào MonoBehaviour fields.
 */
export class GameAlgorithmHelper {
    /**
     * Khoảng tolerance cho điểm, object có điểm không được vượt quá target point + POINT_TOLERANCE
     */
    private static readonly POINT_TOLERANCE: number = 1;

    /**
     * Trọng số cho các object có điểm bằng nhau khi random
     */
    private static readonly WEIGHT_EQUAL_MATCH: number = 10;

    /**
     * Trọng số cộng thêm nếu object đã có trong cache và cache đó có slot trống
     */
    private static readonly WEIGHT_ADDITION_IF_IN_CACHE_HAS_SLOT: number = 10;

    /**
     * Giới hạn tối đa cho số lượng hole count khi tính toán
     */
    private static readonly MAX_HOLE_COUNT_CLAMP: number = 100;

    /**
     * Số lượng điểm mặc định để tính toán (lấy 3 điểm nhỏ nhất)
     */
    private static readonly DEFAULT_POINT_COUNT: number = 3;


    /**
     * Tính toán target id tiếp theo dựa trên các tham số được truyền vào.
     * 
     * Thuật toán hoạt động theo thứ tự ưu tiên:
     * 1. Kiểm tra xem có object nào có số lượng quá nhiều so với trung bình không (cân bằng số lượng)
     * 2. Tính toán điểm mục tiêu dựa trên độ khó và số slot trống
     * 3. Tìm object có điểm gần nhất với điểm mục tiêu (tối ưu độ khó)
     * 4. Fallback: chọn ngẫu nhiên object còn lại nếu không tìm được object phù hợp
     */
    public static getNextTargetId(param: NextTargetParams): NextTargetResult {
        // ============ BƯỚC 1: CÂN BẰNG SỐ LƯỢNG ============
        // Ưu tiên spawn object nào có số lượng quá nhiều để cân bằng
        // Lấy 4 loại object có số lượng lớn nhất làm baseline
        const top4Objects = Array.from(param.idCountRemainingDict.entries())
            .filter(([_, count]) => count > 0)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4);

        if (top4Objects.length > 0) {
            // Tính số lượng trung bình dựa trên top 4 loại object
            // Chia cho max(4, count) để đảm bảo consistency ngay cả khi có ít hơn 4 loại
            const screwCount = top4Objects.reduce((sum, [_, count]) => sum + count, 0);
            const avgScrewCount = screwCount / Math.max(4, top4Objects.length);

            // Ngưỡng tối đa = 2 lần trung bình. Object vượt ngưỡng này sẽ được ưu tiên spawn
            const maxScrewCount = avgScrewCount * 2;

            // Duyệt qua tất cả các object để tìm object có số lượng quá nhiều
            for (const [objectId, count] of param.idCountRemainingDict.entries()) {
                // Bỏ qua object đã có box đang active
                if (param.currentBoxesIds.indexOf(objectId) !== -1) continue;

                // Nếu số lượng vượt ngưỡng -> return ngay để cân bằng
                if (count > maxScrewCount) {
                    return {
                        targetId: objectId,
                        realPoint: this.getObjectPoint(param.idPointDict, objectId),
                        overLimit: true
                    };
                }
            }
        }

        // ============ BƯỚC 2: TÍNH ĐIỂM MỤC TIÊU ============
        // Target point = độ khó * số slot trống (clamped)
        // Điểm càng cao = object càng khó lấy (đứng ở vị trí sâu)
        const targetPoint = param.difficultPoint * Math.max(1, Math.min(this.MAX_HOLE_COUNT_CLAMP, param.freeHoleCount));

        // Tính điểm hiện tại từ các box đang active
        // Mỗi box đóng góp điểm dựa trên số slot trống của nó
        let currentPoint = 0;
        for (const [boxId, freeSlotCount] of param.currentBoxesIdFreeSlotCount.entries()) {
            let boxPoint = this.getObjectPointCustomCount(param.idPointsDict, boxId, freeSlotCount);
            boxPoint = Math.max(0, Math.min(param.freeHoleCount, boxPoint));
            currentPoint += boxPoint;
        }

        // Điểm cần spawn = target - current
        let point = targetPoint - currentPoint;

        // Clamp 1: Không vượt quá số slot trống
        point = Math.max(0, Math.min(param.freeHoleCount, point));

        // Clamp 2: Không tăng quá nhanh so với lần trước (smooth progression)
        point = Math.max(0, Math.min(param.lastPoint + this.POINT_TOLERANCE, point));

        // ============ BƯỚC 3: TÌM OBJECT GẦN ĐIỂM MỤC TIÊU NHẤT ============
        const nearest = this.getNearestColorByPoint(param, point);

        if (nearest.id !== -1) {
            const realPoint = this.getObjectPoint(param.idPointDict, nearest.id);
            return {
                targetId: nearest.id,
                realPoint: realPoint,
                pointRequest: point,
                fromCloset: nearest.fromCloset,
                fromRandomWeight: nearest.fromRandomWeight
            };
        }

        // ============ BƯỚC 4: FALLBACK - CHỌN NGẪU NHIÊN ============
        // Nếu không tìm được object phù hợp, chọn random object còn lại
        const ignoreColors = param.currentBoxesIds;

        const fallbackColor = this.getFallbackBoxColor(param.idCountRemainingDict, ignoreColors, param.idPointDict);
        if (fallbackColor !== -1) {
            return {
                targetId: fallbackColor,
                realPoint: this.getObjectPoint(param.idPointDict, fallbackColor),
                pointRequest: point,
                isFallBack: true
            };
        }

        // Không tìm được object nào -> log exception
        console.error("Cannot find next target id");
        return {
            targetId: -1,
            realPoint: 0
        };
    }

    /**
     * Tìm object có điểm gần nhất với điểm mục tiêu.
     * Nếu có nhiều object cùng khoảng cách, sử dụng weighted random để chọn.
     */
    private static getNearestColorByPoint(
        param: NextTargetParams,
        point: number
    ): { id: number; fromCloset: boolean; fromRandomWeight: boolean } {
        let id = -1; // Object Id được chọn
        let minPoint = Number.MAX_VALUE; // Khoảng cách nhỏ nhất tìm được
        let isUseWeight = false; // Flag để biết có nhiều object cùng khoảng cách không
        const idWeightDict = new Map<number, number>(); // Weight cho random
        let fromCloset = false;
        let fromRandomWeight = false;

        // Duyệt qua tất cả object còn lại
        for (const [currentId, count] of param.idCountRemainingDict.entries()) {
            if (count === 0) {
                continue; // Bỏ qua object đã hết
            }

            // Bỏ qua object đã có box đang active
            if (param.currentBoxesIds && param.currentBoxesIds.indexOf(currentId) !== -1) {
                continue;
            }

            const colorPoint = this.getObjectPoint(param.idPointDict, currentId);

            // Object có điểm quá cao (khó hơn target quá POINT_TOLERANCE) -> bỏ qua
            if (colorPoint > point + this.POINT_TOLERANCE) {
                continue;
            }
            // Tính khoảng cách giữa điểm object và điểm mục tiêu
            const diff = Math.abs(colorPoint - point);
            if (diff < minPoint) {
                // Tìm được object gần hơn -> update
                minPoint = diff;
                id = currentId;
                idWeightDict.clear();
                isUseWeight = false;
            } else if (this.approximately(diff, minPoint)) {
                // Object có cùng khoảng cách -> thêm vào pool để random
                if (!idWeightDict.has(currentId)) {
                    idWeightDict.set(currentId, this.WEIGHT_EQUAL_MATCH);
                }
                isUseWeight = true;

                // Tăng trọng số nếu object có trong cache và cache đó có slot trống
                if (param.currentCacheIds && param.currentCacheIds.indexOf(currentId) !== -1) {
                    idWeightDict.set(currentId, idWeightDict.get(currentId)! + this.WEIGHT_ADDITION_IF_IN_CACHE_HAS_SLOT);
                }
            }
        }

        // Nếu có nhiều object cùng khoảng cách -> random theo weight
        if (isUseWeight) {
            const totalWeight = Array.from(idWeightDict.values()).reduce((sum, w) => sum + w, 0);
            const randomValue = Math.random() * totalWeight;
            let currentWeight = 0;

            // Weighted random selection
            for (const [objectId, weight] of idWeightDict.entries()) {
                currentWeight += weight;
                if (currentWeight >= randomValue) {
                    id = objectId;
                    fromRandomWeight = true;
                    break;
                }
            }
        } else if (id >= 0) {
            fromCloset = true;
        }
        return { id, fromCloset, fromRandomWeight };
    }

    /**
     * Tính tổng điểm của N object gần nhất (N = count).
     * Điểm của object = tổng các điểm nhỏ nhất trong danh sách điểm của nó.
     */
    private static getObjectPointCustomCount(idPointsDict: Map<number, number[]>, objectId: number, count: number): number {
        if (!idPointsDict.has(objectId)) return 0;
        const listPoint = idPointsDict.get(objectId)!;

        // Tính tổng N điểm nhỏ nhất
        let totalPoint = 0;
        const loopCount = Math.min(count, listPoint.length);

        for (let i = 0; i < loopCount; i++) {
            totalPoint += listPoint[i];
        }

        return totalPoint;
    }

    private static getFallbackBoxColor(
        idCountRemainingDict: Map<number, number>,
        ignoreColors: number[],
        idPointDict: Map<number, number>
    ): number {
        const cachedColorKeys: number[] = Array.from(idCountRemainingDict.keys());

        // Sắp xếp theo điểm tăng dần (giống C#)
        cachedColorKeys.sort((a, b) => {
            const pointA = this.getObjectPoint(idPointDict, a);
            const pointB = this.getObjectPoint(idPointDict, b);
            return pointA - pointB;
        });

        if (cachedColorKeys.length === 0) return -1;

        // Lấy màu có điểm nhỏ nhất, ưu tiên màu không bị ignore
        for (const color of cachedColorKeys) {
            if (ignoreColors.indexOf(color) !== -1) continue;
            return color;
        }

        // Nếu tất cả đều bị ignore thì lấy màu có điểm nhỏ nhất (đầu danh sách đã sort)
        return cachedColorKeys[0];
    }

    /**
     * Lấy điểm của một object từ dictionary.
     * Trả về Number.MAX_VALUE nếu không tìm thấy (điểm rất cao = object khó lấy nhất).
     */
    private static getObjectPoint(idPointDict: Map<number, number>, objectId: number): number {
        return idPointDict.has(objectId) ? idPointDict.get(objectId)! : Number.MAX_VALUE;
    }

    /**
     * Kiểm tra hai số có gần bằng nhau không (tương đương Mathf.Approximately)
     */
    private static approximately(a: number, b: number, epsilon: number = 0.00001): boolean {
        return Math.abs(a - b) < epsilon;
    }
}

// Export nested classes
export class NextTargetParams
{
    /**
     * Map chứa từng ID còn lại, số lượng còn lại của ID đó
     * Ví dụ: id = 1, count = 5 nghĩa là còn 5 object id 1 chưa được spawn
     */
    idCountRemainingDict: Map<number, number> = new Map();
    /**
     * Map chứa id của object và các điểm mà object đó đang đứng
     * Ví dụ: id = 1, points = [0, 2, 5] nghĩa là object id 1 có thể đứng ở điểm 0, 2, hoặc 5
     */
    idPointsDict: Map<number, number[]> = new Map();
    /**
     * Map chứa id của object và tổng 3 điểm nhỏ nhất mà object đó đang đứng
     * Ví dụ: id = 1, point = 7 nghĩa là object id 1 có tổng 3 điểm nhỏ nhất là 7 chính là object đó đứng ở điểm 0, 2, và 5,
     * vì 0 + 2 + 5 = 7, data này có thể lấy từ idCountRemainingDict[id]
    */
    idPointDict: Map<number, number> = new Map();
    /**
     * Map chứa id của box hiện tại và số slot trống trong box đó
     */
    currentBoxesIdFreeSlotCount: Map<number, number> = new Map();
    /**     
     * * Danh sách id của box hiện tại
     */
    currentBoxesIds: number[] = [];
    /**
     * Danh sách id của cache hiện tại
     */
    currentCacheIds: number[] = [];
    /**
     * Điểm khó của mục tiêu tiếp theo
     */
    difficultPoint: number = 0;
    /**
     * Số lượng slot trống hiện tại
     */
    freeHoleCount: number = 0;
    
    /**
     * RealPoint của lần tính toán trước đó trong NextTargetResult
     */
    lastPoint: number = 0;
}

export class NextTargetResult {
    targetId: number = -1;
    realPoint: number = 0;

    // Optional debug/flags (kept optional to avoid breaking call sites)
    pointRequest?: number;
    overLimit?: boolean;
    isFallBack?: boolean;
    fromCloset?: boolean;
    fromRandomWeight?: boolean;
}
