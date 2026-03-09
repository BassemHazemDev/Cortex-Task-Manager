import { User } from '../../database/models/user.model';
import { AppError } from '../../utils/handlers/appError';

interface Settings {
  theme?: 'light' | 'dark';
  availableHours?: { start: string; end: string };
  dailyTipIndex?: { date: string; index: number };
  recentSearches?: string[];
}

class SettingsService {
  async getSettings(userId: string): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user.settings;
  }

  async updateSettings(userId: string, patch: Settings): Promise<any> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (patch.theme) {
      user.settings.theme = patch.theme;
    }
    if (patch.availableHours) {
      user.settings.availableHours = patch.availableHours;
    }
    if (patch.dailyTipIndex) {
      user.settings.dailyTipIndex = patch.dailyTipIndex;
    }
    if (patch.recentSearches) {
      user.settings.recentSearches = patch.recentSearches.slice(0, 5);
    }

    await user.save();
    return user.settings;
  }
}

export default new SettingsService();
