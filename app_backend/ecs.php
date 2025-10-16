<?php

declare(strict_types=1);

use PHP_CodeSniffer\Standards\Generic\Sniffs\Files\LineLengthSniff;
use PhpCsFixer\Fixer\ArrayNotation\{ArraySyntaxFixer, NoWhitespaceBeforeCommaInArrayFixer};
use PhpCsFixer\Fixer\CastNotation\CastSpacesFixer;
use PhpCsFixer\Fixer\ClassNotation\{OrderedInterfacesFixer, OrderedTraitsFixer};
use PhpCsFixer\Fixer\ControlStructure\{NoSuperfluousElseifFixer, TrailingCommaInMultilineFixer};
use PhpCsFixer\Fixer\Import\{GlobalNamespaceImportFixer, GroupImportFixer, NoUnusedImportsFixer};
use PhpCsFixer\Fixer\LanguageConstruct\SingleSpaceAroundConstructFixer;
use PhpCsFixer\Fixer\Operator\{ConcatSpaceFixer, NotOperatorWithSuccessorSpaceFixer};
use PhpCsFixer\Fixer\PhpUnit\{PhpUnitDataProviderStaticFixer, PhpUnitMethodCasingFixer};
use PhpCsFixer\Fixer\StringNotation\SingleQuoteFixer;
use PhpCsFixer\Fixer\Whitespace\{ArrayIndentationFixer, BlankLineBeforeStatementFixer};
use PhpCsFixer\Fixer\Whitespace\MethodChainingIndentationFixer;
use Symplify\EasyCodingStandard\Config\ECSConfig;
use Symplify\EasyCodingStandard\ValueObject\Set\SetList;

return static function (EcsConfig $ecsConfig): void {
    $ecsConfig->import(SetList::PSR_12);

    $ecsConfig->rulesWithConfiguration([
        LineLengthSniff::class => ['absoluteLineLimit' => 120],
        ArraySyntaxFixer::class => ['syntax' => 'short'],
        ConcatSpaceFixer::class => ['spacing' => 'none'],
        TrailingCommaInMultilineFixer::class => ['elements' => ['arrays']],
        PhpUnitMethodCasingFixer::class => ['case' => 'snake_case'],
        PhpUnitDataProviderStaticFixer::class => ['force' => true],
    ]);

    $ecsConfig->rules([
        ArrayIndentationFixer::class,
        BlankLineBeforeStatementFixer::class,
        CastSpacesFixer::class,
        GlobalNamespaceImportFixer::class,
        GroupImportFixer::class,
        MethodChainingIndentationFixer::class,
        NoSuperfluousElseifFixer::class,
        NotOperatorWithSuccessorSpaceFixer::class,
        NoUnusedImportsFixer::class,
        NoWhitespaceBeforeCommaInArrayFixer::class,
        OrderedInterfacesFixer::class,
        OrderedTraitsFixer::class,
        PhpUnitDataProviderStaticFixer::class,
        SingleQuoteFixer::class,
        SingleSpaceAroundConstructFixer::class,
    ]);

    $ecsConfig->paths([
        __DIR__.'/app',
        __DIR__.'/tests',
        __DIR__.'/routes',
        __DIR__.'/database',
        __DIR__.'/bootstrap/app.php',
        __DIR__.'/ecs.php',
    ]);

    $ecsConfig->skip([
        __DIR__.'tests',
    ]);
};
