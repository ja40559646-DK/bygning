export function createInMemoryProjectRepository() {
  const projectsById = new Map();
  const projectsByEmail = new Map();

  return {
    save(project) {
      projectsById.set(project.id, project);
      projectsByEmail.set(project.customerAddress.email, project);
      return project;
    },

    findById(projectId) {
      return projectsById.get(projectId) || null;
    },

    findByEmail(email) {
      return projectsByEmail.get(email) || null;
    },

    list() {
      return [...projectsById.values()];
    }
  };
}
