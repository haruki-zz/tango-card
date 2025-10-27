import type { CardEntity } from '../../domain/card/card_entity';
import type { StorageDriver } from './storage_driver';

export class CardRepository {
  private readonly storage_driver: StorageDriver;

  constructor(storage_driver: StorageDriver) {
    this.storage_driver = storage_driver;
  }

  async list_cards(): Promise<CardEntity[]> {
    return this.storage_driver.read_cards();
  }

  async find_card(card_id: string): Promise<CardEntity | undefined> {
    const cards = await this.storage_driver.read_cards();
    return cards.find((card) => card.id === card_id);
  }

  async upsert_card(card: CardEntity): Promise<void> {
    const cards = await this.storage_driver.read_cards();
    const existing_index = cards.findIndex((item) => item.id === card.id);
    if (existing_index >= 0) {
      cards[existing_index] = card;
    } else {
      cards.push(card);
    }
    await this.storage_driver.write_cards(cards);
  }

  async replace_cards(cards: CardEntity[]): Promise<void> {
    await this.storage_driver.write_cards(cards);
  }
}
