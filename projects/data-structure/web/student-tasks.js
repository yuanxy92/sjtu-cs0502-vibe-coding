/*
 * CS0502 · Data Structures project starter
 *
 * Implement the required algorithms in this file only. The renderer calls
 * findPlaces() and findPath() below; keep their return shapes unchanged.
 * Read ../STUDENT_TASKS.md before asking your coding agent to begin.
 */
window.CampusTasks = {
  findPlaces(query, pois, options) {
    const algorithm = options ? options.algorithm : 'array';
    const names = {
      array: '数组顺序查找',
      linked_list: '单链表顺序查找',
      binary: '二分查找（名称前缀）',
      bst: '二叉搜索树（精确名称）',
      hash: '哈希表（精确名称，加分）',
    };

    // STARTER STUB — search is intentionally not implemented.
    // Ask your AI coding agent to replace this return value with a real implementation.
    // When it is implemented, remove the `message` field so the UI can show results.
    return {
      matches: [],
      comparisons: 0,
      structure: (names[algorithm] || algorithm) + '（待实现）',
      message: '查找功能尚未实现：请让 AI coding agent 在 web/student-tasks.js 中完成 ' + (names[algorithm] || algorithm) + '。',
    };
  },

  findPath(graphPayload, startNodeId, endNodeId, options) {
    const algorithm = options ? options.algorithm : 'bfs';
    const names = {
      bfs: 'BFS（最少边数）',
      dijkstra: 'Dijkstra（最短距离）',
      astar: 'A*（加分）',
    };

    // STARTER STUB — pathfinding is intentionally not implemented.
    // Ask your AI coding agent to replace this return value with a real implementation.
    // When it is implemented, remove the `message` field so the UI can draw the route.
    return {
      path: [],
      distance_m: null,
      visited_count: 0,
      algorithm: (names[algorithm] || algorithm) + '（待实现）',
      message: '算法尚未实现：请在 web/student-tasks.js 中完成 ' + (names[algorithm] || algorithm) + '。',
    };
  },
};
