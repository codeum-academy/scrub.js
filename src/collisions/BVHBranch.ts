/**
 * @private
 */
const branch_pool = [];

/**
 * A branch within a BVH
 * @class
 * @private
 */
class BVHBranch {
    protected _bvh_parent = null;
    protected _bvh_branch = true;
    protected _bvh_left = null;
    protected _bvh_right = null;
    protected _bvh_sort = 0;
    protected _bvh_min_x = 0;
    protected _bvh_min_y = 0;
    protected _bvh_max_x = 0;
    protected _bvh_max_y = 0;

	/**
	 * Returns a branch from the branch pool or creates a new branch
	 * @returns {BVHBranch}
	 */
	static getBranch() {
		if(branch_pool.length) {
			return branch_pool.pop();
		}

		return new BVHBranch();
	}

	/**
	 * Releases a branch back into the branch pool
	 * @param {BVHBranch} branch The branch to release
	 */
	static releaseBranch(branch) {
		branch_pool.push(branch);
	}

	/**
	 * Sorting callback used to sort branches by deepest first
	 * @param {BVHBranch} a The first branch
	 * @param {BVHBranch} b The second branch
	 * @returns {Number}
	 */
	static sortBranches(a, b) {
		return a.sort > b.sort ? -1 : 1;
	}
}
