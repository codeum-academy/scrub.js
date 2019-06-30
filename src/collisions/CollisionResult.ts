/**
 * An object used to collect the detailed results of a collision test
 *
 * > **Note:** It is highly recommended you recycle the same Result object if possible in order to avoid wasting memory
 * @class
 */
class CollisionResult {
    /**
     * True if a collision was detected
     */
    collision = false;

    /**
     * The source body tested
     */
    a: Circle|Polygon|Point = null;

    /**
     * The target body tested against
     */
    b: Circle|Polygon|Point = null;

    /**
     * True if A is completely contained within B
     */
    a_in_b = false;

    /**
     * True if B is completely contained within A
     */
    b_in_a = false;

    /**
     * The magnitude of the shortest axis of overlap
     */
    overlap = 0;

    /**
     * The X direction of the shortest axis of overlap
     */
    overlap_x = 0;

    /**
     * The Y direction of the shortest axis of overlap
     */
    overlap_y = 0;
}
