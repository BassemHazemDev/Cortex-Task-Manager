import { Template, ITemplate } from '../../database/models/template.model';
import { AppError } from '../../utils/handlers/appError';

class TemplateService {
  async findAll(userId: string): Promise<ITemplate[]> {
    return Template.find({ createdBy: userId });
  }

  async create(userId: string, data: { name: string; descriptionType?: string; defaults?: any }): Promise<ITemplate> {
    const template = await Template.create({
      ...data,
      createdBy: userId,
      isSystem: false,
    });
    return template;
  }

  async delete(userId: string, id: string): Promise<ITemplate> {
    const template = await Template.findOne({ _id: id, createdBy: userId });
    if (!template) {
      throw new AppError('Template not found', 404);
    }

    if (template.isSystem) {
      throw new AppError('Cannot delete system template', 403);
    }

    await Template.findByIdAndDelete(id);
    return template;
  }
}

export default new TemplateService();
