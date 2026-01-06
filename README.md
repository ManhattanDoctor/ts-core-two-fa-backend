# @ts-core/two-fa-backend

Серверная TypeScript библиотека для двухфакторной аутентификации (2FA). Предоставляет сервисы, сущности базы данных, контроллеры и интерфейсы провайдеров для реализации 2FA в вашем приложении.

## Содержание

- [Установка](#установка)
- [Зависимости](#зависимости)
- [Архитектура](#архитектура)
- [Основные сервисы](#основные-сервисы)
- [Сущность базы данных](#сущность-базы-данных)
- [Интерфейс провайдера](#интерфейс-провайдера)
- [Контроллеры](#контроллеры)
- [Полный пример настройки](#полный-пример-настройки)
- [Процесс работы 2FA](#процесс-работы-2fa)
- [Обработка ошибок](#обработка-ошибок)
- [Связанные пакеты](#связанные-пакеты)

## Установка

```bash
npm install @ts-core/two-fa-backend
```

```bash
yarn add @ts-core/two-fa-backend
```

```bash
pnpm add @ts-core/two-fa-backend
```

## Зависимости

| Пакет | Описание |
|-------|----------|
| `@ts-core/backend` | Серверные утилиты и работа с TypeORM |
| `@ts-core/common` | Базовые классы и интерфейсы |
| `@ts-core/two-fa` | Общие интерфейсы 2FA |
| `typeorm` | ORM для работы с базой данных |

## Архитектура

```
@ts-core/two-fa-backend
├── TwoFaService           # Основной сервис управления 2FA
├── TwoFaDatabaseService   # Сервис работы с БД
├── database/
│   └── TwoFaEntity        # Сущность для хранения 2FA
├── provider/
│   └── ITwoFaProvider     # Интерфейс провайдера (TOTP, SMS и др.)
└── controller/
    ├── TwoFaCreateControllerBase
    ├── TwoFaSaveControllerBase
    ├── TwoFaListControllerBase
    ├── TwoFaRemoveControllerBase
    ├── TwoFaResetStartControllerBase
    └── TwoFaResetFinishControllerBase
```

## Основные сервисы

### TwoFaService

Главный сервис для управления двухфакторной аутентификацией:

```typescript
import { TwoFaService } from '@ts-core/two-fa-backend';
import { TotpProvider } from '@ts-core/two-fa-totp';

// Создание сервиса с провайдерами
const twoFaService = new TwoFaService(logger, databaseService, [totpProvider]);

// Добавление провайдера динамически
twoFaService.providers.add(smsProvider);
```

#### Методы TwoFaService

| Метод | Описание |
|-------|----------|
| `create(ownerUid, type)` | Создаёт новую запись 2FA, возвращает детали для настройки |
| `save(ownerUid, type, token)` | Активирует 2FA после проверки токена |
| `validate(ownerUid, type, token)` | Проверяет токен при входе |
| `resetStart(ownerUid, type)` | Начинает процесс сброса, возвращает resetUid |
| `resetFinish(resetUid)` | Завершает сброс 2FA |
| `getProvider(type)` | Получает провайдер по типу |

```typescript
// Создание 2FA для пользователя
const details = await twoFaService.create(userId, 'totp');
// details содержит secret и другие данные для QR-кода

// Сохранение/активация после подтверждения
await twoFaService.save(userId, 'totp', '123456');

// Валидация токена при входе
await twoFaService.validate(userId, 'totp', '123456');

// Сброс 2FA (если пользователь потерял доступ)
const resetUid = await twoFaService.resetStart(userId, 'totp');
// После подтверждения через email:
await twoFaService.resetFinish(resetUid);
```

### TwoFaDatabaseService

Сервис для операций с базой данных:

```typescript
import { TwoFaDatabaseService } from '@ts-core/two-fa-backend';
import { Connection } from 'typeorm';

export class MyTwoFaDatabaseService extends TwoFaDatabaseService {
    constructor(logger: ILogger, connection: Connection) {
        super(logger, connection);
    }
}
```

#### Методы TwoFaDatabaseService

| Метод | Описание |
|-------|----------|
| `get(ownerUid, type)` | Получает запись 2FA по владельцу и типу |
| `has(ownerUid, isEnabled?)` | Проверяет наличие 2FA у пользователя |
| `save(entity)` | Сохраняет сущность в БД |
| `remove(id)` | Удаляет запись по ID |
| `twoFa` | Геттер репозитория TypeORM |

```typescript
// Проверка, есть ли у пользователя активная 2FA
const hasEnabled2FA = await databaseService.has(userId, true);

// Получение конкретной записи
const twoFa = await databaseService.get(userId, 'totp');
```

## Сущность базы данных

### TwoFaEntity

Сущность TypeORM для хранения данных 2FA:

```typescript
import { TwoFaEntity } from '@ts-core/two-fa-backend';

@Entity({ name: 'two_fa' })
@Index(['type', 'ownerUid'], { unique: true })
class TwoFaEntity implements ITwoFa {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    type: string;              // Тип 2FA (totp, sms, email)

    @Column({ name: 'owner_uid', type: 'integer' })
    ownerUid: TwoFaOwnerUid;   // ID владельца

    @Column({ nullable: true, type: 'json' })
    details: any;              // Детали (secret, телефон и т.д.)

    @Column({ name: 'reset_uid', nullable: true })
    resetUid: string;          // UID для сброса

    @Column({ name: 'is_temporary' })
    isTemporary: boolean;      // true = ещё не активирована

    @CreateDateColumn({ name: 'created_date' })
    createdDate: Date;

    @UpdateDateColumn({ name: 'updated_date' })
    updatedDate: Date;

    // Вычисляемые свойства
    get isEnabled(): boolean;    // true если активирована
    get isResetting(): boolean;  // true если идёт процесс сброса

    // Методы
    toObject(): ITwoFa;          // Преобразование в DTO
    static create<T>(ownerUid, type, details): TwoFaEntity;
}
```

#### Миграция для создания таблицы

```sql
CREATE TABLE two_fa (
    id SERIAL PRIMARY KEY,
    type VARCHAR NOT NULL,
    owner_uid INTEGER NOT NULL,
    details JSON,
    reset_uid VARCHAR,
    is_temporary BOOLEAN NOT NULL DEFAULT true,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(type, owner_uid)
);
```

## Интерфейс провайдера

### ITwoFaProvider

Интерфейс для реализации различных типов 2FA:

```typescript
interface ITwoFaProvider<T = any> {
    readonly type: string;  // Уникальный идентификатор типа

    // Создание новой 2FA, возвращает детали (secret и т.д.)
    create(ownerUid: TwoFaOwnerUid): Promise<T>;

    // Проверка токена
    validate(token: string, details: T): Promise<ITwoFaValidateDetails>;
}

interface ITwoFaValidateDetails {
    isValid: boolean;
}
```

#### Пример реализации провайдера

```typescript
import { ITwoFaProvider, ITwoFaValidateDetails } from '@ts-core/two-fa-backend';

export class SmsProvider implements ITwoFaProvider<ISmsDetails> {
    readonly type = 'sms';

    constructor(private smsService: SmsService) {}

    async create(ownerUid: TwoFaOwnerUid): Promise<ISmsDetails> {
        // Генерация и отправка кода
        const code = this.generateCode();
        await this.smsService.send(phone, code);
        return { code, phone, expiresAt: Date.now() + 300000 };
    }

    async validate(token: string, details: ISmsDetails): Promise<ITwoFaValidateDetails> {
        const isValid = token === details.code && Date.now() < details.expiresAt;
        return { isValid };
    }

    private generateCode(): string {
        return Math.random().toString().substring(2, 8);
    }
}

interface ISmsDetails {
    code: string;
    phone: string;
    expiresAt: number;
}
```

## Контроллеры

Библиотека предоставляет базовые контроллеры для быстрой интеграции:

### TwoFaCreateControllerBase

```typescript
import { TwoFaCreateControllerBase } from '@ts-core/two-fa-backend';

@Controller('2fa')
export class TwoFaController extends TwoFaCreateControllerBase {
    constructor(service: TwoFaService) {
        super(service);
    }

    @Post('create')
    async create(@Body() dto: ITwoFaCreateDto): Promise<ITwoFaCreateDtoResponse> {
        return super.execute(dto);
    }
}
```

### TwoFaSaveControllerBase

```typescript
import { TwoFaSaveControllerBase } from '@ts-core/two-fa-backend';

@Controller('2fa')
export class TwoFaSaveController extends TwoFaSaveControllerBase {
    constructor(service: TwoFaService) {
        super(service);
    }

    @Post('save')
    async save(@Body() dto: ITwoFaSaveDto): Promise<void> {
        return super.execute(dto);
    }
}
```

### Все доступные контроллеры

| Контроллер | Операция | DTO |
|------------|----------|-----|
| `TwoFaCreateControllerBase` | Создание 2FA | `ITwoFaCreateDto` |
| `TwoFaSaveControllerBase` | Активация 2FA | `ITwoFaSaveDto` |
| `TwoFaListControllerBase` | Список 2FA | `ITwoFaListDto` |
| `TwoFaRemoveControllerBase` | Удаление 2FA | `{ id: number }` |
| `TwoFaResetStartControllerBase` | Начало сброса | `ITwoFaResetStartDto` |
| `TwoFaResetFinishControllerBase` | Завершение сброса | `ITwoFaResetFinishDto` |

## Полный пример настройки

### Модуль NestJS

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TwoFaEntity, TwoFaService, TwoFaDatabaseService } from '@ts-core/two-fa-backend';
import { TotpProvider } from '@ts-core/two-fa-totp';
import { Logger } from '@ts-core/common';

@Module({
    imports: [
        TypeOrmModule.forFeature([TwoFaEntity])
    ],
    providers: [
        TwoFaDatabaseService,
        {
            provide: TwoFaService,
            useFactory: (logger: Logger, db: TwoFaDatabaseService) => {
                // Создание TOTP провайдера
                const totpProvider = new TotpProvider(logger, {
                    name: 'MyApp',      // Имя приложения в аутентификаторе
                    length: 20,         // Длина секрета
                    window: 1           // Окно валидации (±1 интервал)
                });

                return new TwoFaService(logger, db, [totpProvider]);
            },
            inject: [Logger, TwoFaDatabaseService]
        }
    ],
    controllers: [TwoFaController],
    exports: [TwoFaService]
})
export class TwoFaModule {}
```

### Контроллер

```typescript
import { Controller, Post, Body, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { TwoFaService } from '@ts-core/two-fa-backend';
import { AuthGuard } from './auth.guard';
import { User } from './user.decorator';

@Controller('2fa')
@UseGuards(AuthGuard)
export class TwoFaController {
    constructor(private twoFaService: TwoFaService) {}

    @Post('create')
    async create(@Body('type') type: string, @User() user) {
        const details = await this.twoFaService.create(user.id, type);
        return { type, details };
    }

    @Post('enable')
    async enable(
        @Body('type') type: string,
        @Body('token') token: string,
        @User() user
    ) {
        await this.twoFaService.save(user.id, type, token);
        return { success: true };
    }

    @Post('validate')
    async validate(
        @Body('type') type: string,
        @Body('token') token: string,
        @User() user
    ) {
        await this.twoFaService.validate(user.id, type, token);
        return { success: true };
    }

    @Post('reset/start')
    async resetStart(@Body('type') type: string, @User() user) {
        const resetUid = await this.twoFaService.resetStart(user.id, type);
        // Отправить resetUid на email для верификации
        return { success: true };
    }

    @Post('reset/finish')
    async resetFinish(@Body('resetUid') resetUid: string) {
        const twoFa = await this.twoFaService.resetFinish(resetUid);
        return { success: true, twoFa };
    }
}
```

## Процесс работы 2FA

```
┌─────────────────────────────────────────────────────────────────┐
│                        НАСТРОЙКА 2FA                            │
├─────────────────────────────────────────────────────────────────┤
│ 1. Пользователь запрашивает настройку    →  POST /2fa/create   │
│ 2. Сервер создаёт запись (isTemporary=true)                    │
│ 3. Возвращаются детали (secret для QR-кода)                    │
│ 4. Пользователь сканирует QR и вводит код → POST /2fa/enable   │
│ 5. Сервер проверяет код и активирует (isTemporary=false)       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                       ВАЛИДАЦИЯ ПРИ ВХОДЕ                       │
├─────────────────────────────────────────────────────────────────┤
│ 1. Пользователь вводит логин/пароль                            │
│ 2. Сервер проверяет наличие активной 2FA                       │
│ 3. Если есть → запрашивает токен      → POST /2fa/validate     │
│ 4. Пользователь вводит код из аутентификатора                  │
│ 5. Сервер проверяет код и разрешает вход                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          СБРОС 2FA                              │
├─────────────────────────────────────────────────────────────────┤
│ 1. Пользователь потерял доступ к аутентификатору               │
│ 2. Запрос на сброс                     → POST /2fa/reset/start │
│ 3. Сервер генерирует resetUid и отправляет на email            │
│ 4. Пользователь переходит по ссылке                            │
│ 5. Завершение сброса                   → POST /2fa/reset/finish│
│ 6. 2FA удаляется, пользователь может настроить заново          │
└─────────────────────────────────────────────────────────────────┘
```

## Обработка ошибок

```typescript
import { ExtendedError } from '@ts-core/common';

try {
    await twoFaService.validate(userId, 'totp', token);
} catch (error) {
    if (error instanceof ExtendedError) {
        switch (error.code) {
            case ExtendedError.HTTP_CODE_FORBIDDEN:
                // Неверный токен или 2FA не настроена
                console.log('Доступ запрещён:', error.message);
                break;
            default:
                console.log('Ошибка:', error.message);
        }
    }
}
```

### Возможные ошибки

| Ситуация | Код ошибки | Сообщение |
|----------|------------|-----------|
| 2FA уже активирована | `HTTP_CODE_FORBIDDEN` | Unable to create 2FA: it's already enabled |
| 2FA не найдена | `HTTP_CODE_FORBIDDEN` | Unable to verify: 2FA is nil |
| Неверный токен | `HTTP_CODE_FORBIDDEN` | Unable to verify: token is invalid |
| Провайдер не найден | — | Unable to get "{type}" provider |

## Связанные пакеты

| Пакет | Описание |
|-------|----------|
| `@ts-core/two-fa` | Общие интерфейсы и типы |
| `@ts-core/two-fa-totp` | TOTP провайдер (Google Authenticator, Authy) |

## Автор

**Renat Gubaev** — [renat.gubaev@gmail.com](mailto:renat.gubaev@gmail.com)

- GitHub: [ManhattanDoctor](https://github.com/ManhattanDoctor)
- Репозиторий: [ts-core-two-fa-backend](https://github.com/ManhattanDoctor/ts-core-two-fa-backend)

## Лицензия

ISC
