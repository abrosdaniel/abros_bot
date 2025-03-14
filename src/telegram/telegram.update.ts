import { Injectable } from '@nestjs/common';
import { Start, Update, Ctx, On, Action, Command } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Update as TelegrafUpdate } from 'telegraf/types';
import { TelegramService } from './telegram.service';
import { UserService } from '../user/user.service';
import { AppwriteService } from '../appwrite/appwrite.service';

type TelegrafContext = Context<TelegrafUpdate>;

@Update()
@Injectable()
export class TelegramUpdate {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly userService: UserService,
    private readonly appwriteService: AppwriteService,
  ) {}

  @Start()
  async onStart(@Ctx() ctx: TelegrafContext) {
    await this.telegramService.sendMainMenu(ctx);
  }

  @Command('menu')
  async onMenuCommand(@Ctx() ctx: TelegrafContext) {
    // Проверяем, что команда вызвана в приватном чате
    if (ctx.chat?.type !== 'private') {
      return;
    }
    await this.telegramService.sendMainMenu(ctx);
  }

  @Action('account')
  async onAccount(@Ctx() ctx: any) {
    const userData = await this.appwriteService.getUserData(ctx);
    if (userData) {
      await this.telegramService.sendAccountMenu(ctx, userData);
    } else {
      await ctx.editMessageText('Пожалуйста, введите вашу почту:', {
        reply_markup: {
          inline_keyboard: [[{ text: '« Назад', callback_data: 'main_menu' }]],
        },
      });
    }
  }

  @Action('contact')
  async onContact(@Ctx() ctx: any) {
    await this.telegramService.sendContactMenu(ctx);
  }

  @Action('edit_account')
  async onEditAccount(@Ctx() ctx: any) {
    const userData = await this.appwriteService.getUserData(ctx);
    if (userData) {
      await this.telegramService.sendEditAccountMenu(ctx, userData);
    }
  }

  @Action('sessions')
  async onSessions(@Ctx() ctx: TelegrafContext) {
    if (!ctx.callbackQuery) return;
    await ctx.editMessageText('Функция в разработке', {
      reply_markup: {
        inline_keyboard: [[{ text: '« Назад', callback_data: 'account' }]],
      },
    });
  }

  @Action('order')
  async onOrder(@Ctx() ctx: TelegrafContext) {
    await this.telegramService.startOrder(ctx);
  }

  @Action('support')
  async onSupport(@Ctx() ctx: TelegrafContext) {
    await this.telegramService.startSupport(ctx);
  }

  // @Action(/^(accept|vote|reject)_proposal:(\d+)$/)
  // async onProposalAction(@Ctx() ctx: any) {
  //   if (!ctx.callbackQuery?.data) return;

  //   const [action, userId] = ctx.callbackQuery.data.split(':');
  //   const adminId = process.env.TELEGRAM_ADMIN_PEER_ID;

  //   // Проверяем, что действие выполняет админ
  //   if (ctx.callbackQuery.from.id.toString() !== adminId) return;

  //   let message = '';
  //   switch (action) {
  //     case 'accept_proposal':
  //       message = '✅ Ваше предложение принято!';
  //       // Закрепляем сообщение
  //       try {
  //         await ctx.pinChatMessage(ctx.callbackQuery.message.message_id);
  //       } catch (error) {
  //         console.error('Ошибка при закреплении сообщения:', error);
  //       }
  //       break;

  //     case 'vote_proposal':
  //       message = '🗳 Ваше предложение отправлено на голосование.';
  //       // Создаем голосование в канале
  //       try {
  //         const proposalText = ctx.callbackQuery.message.text;

  //         const match = proposalText.match(
  //           /👤 (.*?)(?:\n\n|$).*?📝 Предлагает:\n(.*)/s,
  //         );
  //         if (match) {
  //           const [, author, text] = match;
  //           const pollMessage = text;

  //           const channelId = process.env.TELEGRAM_CHANNEL_PEER_ID;
  //           if (!channelId) {
  //             throw new Error(
  //               'TELEGRAM_CHANNEL_PEER_ID не установлен в .env файле',
  //             );
  //           }
  //           await this.telegramService.createPoll(channelId, pollMessage);
  //         } else {
  //           console.error('Не удалось извлечь текст предложения из сообщения');
  //           throw new Error('Неверный формат сообщения предложения');
  //         }
  //       } catch (error) {
  //         console.error('Ошибка при создании голосования:', error);
  //         message = '❌ Ошибка при создании голосования. Попробуйте позже.';
  //       }
  //       break;

  //     case 'reject_proposal':
  //       message = '❌ К сожалению, ваше предложение отклонено.';
  //       // Удаляем сообщение
  //       try {
  //         await ctx.deleteMessage();
  //         // Отправляем ответ пользователю
  //         await this.telegramService.sendMessage(parseInt(userId), message);
  //         return; // Выходим, так как сообщение уже удалено
  //       } catch (error) {
  //         console.error('Ошибка при удалении сообщения:', error);
  //       }
  //       break;
  //   }

  //   // Отправляем ответ пользователю
  //   await this.telegramService.sendMessage(parseInt(userId), message);

  //   // Обновляем сообщение админа (кроме случая с reject, где сообщение удаляется)
  //   if (action !== 'reject_proposal') {
  //     await ctx.editMessageText(
  //       ctx.callbackQuery.message.text + `\n\nСтатус: ${message}`,
  //     );
  //   }
  // }

  @Action('main_menu')
  async onMainMenu(@Ctx() ctx: any) {
    await this.telegramService.sendMainMenu(ctx, true);
  }

  @On('inline_query')
  async onInlineQuery(@Ctx() ctx: any) {
    if (!ctx.inlineQuery) return;

    // Если запрос пустой, показываем доступные команды
    if (!ctx.inlineQuery.query) {
      const commands = [
        {
          type: 'article',
          id: 'inline_commands',
          title: '⌘ Команды',
          description: `💻 Просмотр портфолио - введите "portfolio"`,
          input_message_content: {
            message_text: `
⌘ Список команд:

💻 Просмотр портфолио - введите "portfolio"
            `,
          },
        },
      ];
      await ctx.answerInlineQuery(commands, { cache_time: 0 });
      return;
    }

    if (ctx.inlineQuery.query === 'portfolio') {
      const items = await this.appwriteService.getPortfolioItems();

      items.sort(
        (a, b) =>
          new Date(b.date_start).getTime() - new Date(a.date_start).getTime(),
      );

      const isPrivateChat = ctx.inlineQuery.chat_type === 'sender';

      const results = await Promise.all(
        items.map(async (item) => {
          const baseResult = {
            id: item.$id,
            type: 'article',
            title: item.name,
            description: `📝 ${item.desc}\n\n🧰 Стек: ${item.tags}`,
            thumb_url: item.logo
              ? this.appwriteService.getImageUrl(item.logo)
              : null,
          };

          if (isPrivateChat) {
            return {
              ...baseResult,
              input_message_content: {
                message_text: `/abros-portfolio-${item.$id}`,
              },
            };
          } else {
            const photoUrl = this.appwriteService.getImageUrl(item.pic);
            const formatDate = (dateString: string) => {
              const date = new Date(dateString);
              return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
            };

            const startDate = formatDate(item.date_start);
            const endDate = item.date_end
              ? formatDate(item.date_end)
              : 'настоящее время';
            return {
              ...baseResult,
              input_message_content: {
                message_text: `<a href="${photoUrl}">&#8205;</a>${item.name}\n\n📝 ${item.text}\n\n📅 Ведение: ${startDate} - ${endDate}\n\n🧰 Стек: ${item.tags}`,
                parse_mode: 'HTML',
              },
              reply_markup: {
                inline_keyboard: [[{ text: '👀 Посмотреть', url: item.link }]],
              },
            };
          }
        }),
      );

      await ctx.answerInlineQuery(results, { cache_time: 0 });
    }
  }

  @On('message')
  async onMessage(@Ctx() ctx: any) {
    if (!ctx.message?.text) return;

    // Проверяем, является ли это ответом в чате поддержки
    if (
      ctx.message.reply_to_message &&
      ctx.message.chat.id.toString() === process.env.TELEGRAM_SUPPORT_PEER_ID
    ) {
      const match = ctx.message.reply_to_message.text.match(/ID: (\d+)/);
      if (match) {
        const userId = match[1];
        await this.telegramService.sendSupportReply(
          parseInt(userId),
          ctx.message.text,
          ctx.message.reply_to_message.message_id,
          ctx.message.reply_to_message.text,
        );
        return;
      }
    }

    // Проверяем команду портфолио
    const portfolioMatch = ctx.message.text.match(/^\/abros-portfolio-(.+)$/);
    if (portfolioMatch) {
      const itemId = portfolioMatch[1];
      await this.telegramService.sendPortfolioItem(ctx, itemId);
      return;
    }

    // Обрабатываем сообщения в зависимости от состояния
    if (await this.telegramService.handleOrderMessage(ctx)) return;
    if (await this.telegramService.handleSupportMessage(ctx)) return;
  }

  @Action('reply_support')
  async onReplySupport(@Ctx() ctx: any) {
    const userId = ctx.callbackQuery.from.id;
    const originalMessage = ctx.callbackQuery.message.text;

    this.telegramService.setUserState(userId, 'support', {
      username: ctx.callbackQuery.from.username,
      firstName: ctx.callbackQuery.from.first_name,
      lastName: ctx.callbackQuery.from.last_name,
      originalMessage: originalMessage,
    });

    await ctx.editMessageText('Введите ваш ответ:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '❌ Отменить', callback_data: 'exit_reply_support' }],
        ],
      },
    });
  }

  @Action('exit_reply_support')
  async onExitReplySupport(@Ctx() ctx: any) {
    const userId = ctx.callbackQuery.from.id;
    const userState = await this.telegramService.getUserState(userId);

    if (userState?.data?.originalMessage) {
      await ctx.editMessageText(userState.data.originalMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '↩️ Ответить', callback_data: 'reply_support' },
              { text: '❌ Закрыть тикет', callback_data: 'close_ticket_user' },
            ],
          ],
        },
      });
    }

    this.telegramService.clearUserState(userId);
  }

  @Action('close_ticket_user')
  async onCloseTicketUser(@Ctx() ctx: any) {
    const messageText = ctx.callbackQuery.message.text;
    await ctx.editMessageText(`${messageText}\n\nСтатус: 🔒 Закрыт`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Главное меню', callback_data: 'main_menu' }],
        ],
      },
    });
  }

  @Action(/^close_ticket:(\d+)$/)
  async onCloseTicketSupport(@Ctx() ctx: any) {
    if (!ctx.callbackQuery?.data) return;

    const userId = ctx.callbackQuery.data.split(':')[1];
    const messageId = ctx.callbackQuery.message.message_id;
    const messageText = ctx.callbackQuery.message.text;

    await this.telegramService.handleTicketClose(
      messageId,
      parseInt(userId),
      messageText,
    );
  }
}
