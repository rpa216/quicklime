/*
Quicklime creates a DOM structure for a Communication:

<div class="communication" id="communication_UUID">>
  <div class="section_segmentation" id="section_segmentation_UUID">
    <div class="section" id="section_UUID">
      <div class="sentence_segmentation" id="sentence_segmentation_UUID">
        <div class="sentence" id="sentence_UUID">>
          <div class="controls_and_tokenization_container clearfix">
            <div class="tokenization_controls" id="tokenization_controls_[TOKENIZATION_UUID]">
              <button>
              <button>
              ...
            <div class="tokenization" id="tokenization_UUID">
              <span class="token" id="tokenization_[TOKENIZATION_UUID]_[TOKEN_INDEX_0]">
              <span class="token_padding "id="tokenization_[TOKENIZATION_UUID]_[TOKEN_INDEX_0]">
              <span class="token" id="tokenization_[TOKENIZATION_UUID]_[TOKEN_INDEX_1]">
              <span class="token_padding" id="tokenization_[TOKENIZATION_UUID]_[TOKEN_INDEX_1]">
            ...
          <div class="brat_tokenization_container" id="tokenization_ner_container_[TOKENIZATION_UUID]">
            <div class="brat_tokenization_label brat_ner_tokenization_label">
            <div class="brat_tokenization" id="tokenization_ner_[TOKENIZATION_UUID]">
          <div class="brat_tokenization_container" id="tokenization_pos_container_[TOKENIZATION_UUID]">
            <div class="brat_tokenization_label brat_pos_tokenization_label">
            <div class="brat_tokenization" id="tokenization_pos_[TOKENIZATION_UUID]">
          <div class="dagre_parse" id="constituent_parse_[TOKENIZATION_UUID]">
            <div class="dagre_parse" id="constituent_parse_[TOKENIZATION_UUID]_0">
              <div class="parse_label constituent_parse_label_0">
            <div class="dagre_parse" id="constituent_parse_[TOKENIZATION_UUID]_1">
              <div class="parse_label constituent_parse_label_1">
            ...
          <div class="dagre_parse" id="dependency_parse_[TOKENIZATION_UUID]">
            <div class="dagre_parse" id="dependency_parse_[TOKENIZATION_UUID]_0">
              <div class="parse_label dependency_parse_label_0">
            <div class="dagre_parse" id="dependency_parse_[TOKENIZATION_UUID]_1">
              <div class="parse_label dependency_parse_label_1">
            ...
*/


// Namespace for Quicklime
var QL = {
    _communications: {}
};


/**
 * @param {String} uuid
 * @returns {Communication}
 */
QL.getCommunicationWithUUID = function(uuid) {
  return QL._communications[uuid.uuidString];
};


/** Adds <div>/<span> elements and token text for a Communication to DOM
 *
 * Concrete Communications contain many layers of nested data
 * structures, with lists of SectionSegmentations containing lists of
 * Sections containing lists of SentenceSegmentations, etc.
 *
 * This function takes a Concrete Communication, and adds layers of
 * nested <div>'s and <span>'s to the DOM that reflect the nested data
 * structures in the Communication (with some extra nesting of <div>'s
 * and <span>'s so that the HTML is rendered properly).
 *
 * For each Concrete object of type:
 *   - SectionSegmentation
 *   - Section
 *   - SentenceSegmentation
 *   - Sentence
 *   - Tokenization
 * there is a corresponding <div> with a DOM ID based on the UUID of
 * that Concrete object.
 *
 * Each token string and each space between tokens is wrapped in its
 * own <span>, and these <span>'s have DOM IDs determined by the
 * Tokenization UUID and token index.
 *
 * This function also adds co-reference information to token <span>'s.
 * For each EntityMention, this function finds the token <span>'s
 * associated with the mention, and adds a unique DOM class name
 * (based on the EntityMention's UUID) to each matching token <span>.
 * The function also finds the Entity associated with each
 * EntityMention, and adds a unique DOM class name for that Entity
 * (based on the Entity's UUID) to each matching token <span>.
 *
 * A single token <span> may be assigned many DOM class names.  All
 * these class names make it easy to do things like change the CSS
 * properties (or attach a mouse callback function) to every token
 * associated with an Entity or EntityMention.
 *
 * @param {String} parentElementID - DOM ID of element to attach Communication text to
 * @param {Communication} comm
 */
QL.addCommunication = function(parentElementID, comm) {

  /** Add DOM class(es) to token <span>'s identified by TokenRefSequence
   *  To specify multiple classes, create a single string with the class
   *  names separated by spaces.
   *
   * @param {TokenRefSequence} tokenRefSequence
   * @param {String} className - DOM class(es) to be added to token <span>'s
   */
  function addDOMClassForTokenRefSequence(tokenRefSequence, className) {
    if (tokenRefSequence.tokenIndexList) {
      // Unlike Array.sort(), Underscore's sortBy() sorts arrays of numbers *numerically*
      var tokenIndexList = _.sortBy(tokenRefSequence.tokenIndexList);
      var total_tokens = tokenRefSequence.tokenIndexList.length;

      for (var tokenIndex in tokenIndexList) {
        $('#tokenization_' + tokenRefSequence.tokenizationId.uuidString + '_' + tokenIndexList[tokenIndex])
          .addClass(className);

        // For multi-word mentions, the spaces between tokens are treated as part of the mention
        if (tokenIndex < total_tokens-1 &&
            tokenIndexList[tokenIndex]+1 === tokenIndexList[parseInt(tokenIndex, 10)+1])
        {
          $('#tokenization_padding_' + tokenRefSequence.tokenizationId.uuidString + '_' + tokenIndexList[tokenIndex])
            .addClass(className);
        }
      }
    }
  }

  QL._communications[comm.uuid.uuidString] = comm;

  var parent_element = $('#' + parentElementID);
  var document_div = $('<div>').addClass('communication').attr('id', 'communication_' + comm.uuid.uuidString);
  parent_element.append(document_div);

  // For now, we assume that there is only a single section segmentation
  var section_segmentation_div = $('<div>').addClass('section_segmention')
    .attr('id', 'section_segmentation_' + comm.sectionSegmentationList[0].uuid.uuidString);

  var tokenIndex;

  for (var sectionListIndex in comm.sectionSegmentationList[0].sectionList) {
    var section_div = $('<div>').addClass('section')
      .attr('id', 'section_' + comm.sectionSegmentationList[0].sectionList[sectionListIndex].uuid.uuidString);
    // For now, we assume that there is only a single sentence segmentation
    var sentence_segmentation_div = $('<div>').addClass('sentence_segmentation')
      .attr('id', 'sentence_segmentation_' + comm.sectionSegmentationList[0].uuid.uuidString);
    if (comm.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList) {
      for (var sentenceIndex in comm.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList[0].sentenceList) {
        var sentence = comm.sectionSegmentationList[0].sectionList[sectionListIndex].sentenceSegmentationList[0].sentenceList[sentenceIndex];
        var tokenization = sentence.tokenizationList[0];

        var sentence_div = $('<div>')
          .addClass('sentence')
          .attr('id', 'sentence_' + sentence.uuid.uuidString);

        // Add the Bootstrap CSS class 'clearfix' to the
        // 'controls_and_tokenization_container' <div>, so that the
        // (floating) 'tokenization_controls' and 'tokenization' <div>'s
        // in the container don't affect other <div>'s
        var controls_and_tokenization_container_div = $('<div>')
          .addClass('controls_and_tokenization_container')
          .addClass('clearfix');

        var tokenization_controls_div = $('<div>')
          .addClass('tokenization_controls')
          .attr('id', 'tokenization_controls_' + tokenization.uuid.uuidString);

        controls_and_tokenization_container_div.append(tokenization_controls_div);

        var tokenization_div = $('<div>').addClass('tokenization').attr('id', 'tokenization_' + tokenization.uuid.uuidString);
        for (tokenIndex in tokenization.tokenList.tokenList) {
          var token = tokenization.tokenList.tokenList[tokenIndex];
          var token_span = $('<span>')
            .addClass('token')
            .attr('id', 'tokenization_' + tokenization.uuid.uuidString + "_" + token.tokenIndex)
              .html(QL.cleanedTokenText(token.text));
          var token_padding_span = $('<span>')
            .addClass('token_padding')
            .attr('id', 'tokenization_padding_' + tokenization.uuid.uuidString + "_" + token.tokenIndex)
            .html(" ");
          tokenization_div.append(token_span);
          tokenization_div.append(token_padding_span);
        }
        controls_and_tokenization_container_div.append(tokenization_div);

        sentence_div.append(controls_and_tokenization_container_div);

        sentence_div.append(
          $('<div>')
            .addClass('brat_tokenization_container')
            .attr('id', 'tokenization_ner_container_' + tokenization.uuid.uuidString)
            .css("display", "none")
            .append(
              $('<div>')
                .addClass('brat_tokenization_label brat_ner_tokenization_label')
                .html("NER")
            )
            .append(
              $('<div>')
                .addClass('brat_tokenization')
                .attr('id', 'tokenization_ner_' + tokenization.uuid.uuidString)));
        sentence_div.append(
          $('<div>')
            .addClass('brat_tokenization_container')
            .attr('id', 'tokenization_pos_container_' + tokenization.uuid.uuidString)
            .css("display", "none")
            .append(
              $('<div>')
                .addClass('brat_tokenization_label brat_pos_tokenization_label')
                .html("POS")
            )
            .append(
              $('<div>')
                .addClass('brat_tokenization')
                .attr('id', 'tokenization_pos_' + tokenization.uuid.uuidString)));
        sentence_div.append($('<div>')
          .addClass('dagre_parse')
          .attr('id', 'constituent_parse_' + tokenization.uuid.uuidString));
        sentence_div.append($('<div>')
          .addClass('dagre_parse')
          .attr('id', 'dependency_parse_' + tokenization.uuid.uuidString));
        sentence_div.append($('<div>')
          .addClass('dagre_parse')
          .attr('id', 'ace_relations_' + tokenization.uuid.uuidString));

        sentence_segmentation_div.append(sentence_div);
      }
      section_div.append(sentence_segmentation_div);
    }
    section_segmentation_div.append(section_div);
  }
  document_div.append(section_segmentation_div);

  // Add DOM classes for mentionId's to token <span>'s
  for (var entityMentionSetIndex in comm.entityMentionSetList) {
    if (comm.entityMentionSetList[entityMentionSetIndex].mentionList) {
      for (var mentionListIndex in comm.entityMentionSetList[entityMentionSetIndex].mentionList) {
        var entityMention = comm.entityMentionSetList[entityMentionSetIndex].mentionList[mentionListIndex];
        addDOMClassForTokenRefSequence(entityMention.tokens, "mention mention_" + entityMention.uuid.uuidString);
      }
    }
  }

  // Add DOM class "coref_mention" to any token <span>'s that are part
  // of an EntityMention for an Entity in comm.entitySetList.  In
  // Concrete, it is possible to have EntityMentions that are not tied
  // to any Entity.
  if (comm.entitySetList) {
    for (var entitySetListIndex in comm.entitySetList) {
      for (var entityListIndex in comm.entitySetList[entitySetListIndex].entityList) {
        var entity = comm.entitySetList[entitySetListIndex].entityList[entityListIndex];
        for (var i = 0; i < entity.mentionIdList.length; i++) {
          var entityMentionId = entity.mentionIdList[i];
          $('.mention_' + entityMentionId.uuidString)
            .addClass('coref_mention')
            .addClass('entity_' + entity.uuid.uuidString);
        }
      }
    }
  }

};


/** Add a list of entities, with their mentions, to the DOM
 * @param {String} parentElementID - DOM ID of element to attach table to
 * @param {Communication} comm
 */
QL.addEntityTable = function(parentElementID, comm) {
  if (comm.entitySetList) {
    var entityTable_div = $('<div>');
    $('#' + parentElementID).append(entityTable_div);

    for (var entitySetListIndex in comm.entitySetList) {
      var entityToolHeading = $('<h4>');
      if (comm.entitySetList[entitySetListIndex].metadata) {
        entityToolHeading.html(comm.entitySetList[entitySetListIndex].metadata.tool);
      }
      else {
        entityToolHeading.html('Unknown Entity Tool #' + entitySetListIndex);
      }
      entityTable_div.append(entityToolHeading);

      for (var entityListIndex in comm.entitySetList[entitySetListIndex].entityList) {
        var counter = parseInt(entityListIndex, 10) + 1;
        var entity = comm.entitySetList[entitySetListIndex].entityList[entityListIndex];
        var entity_div = $('<div>');
        var entityCounter_span = $('<span>')
          .addClass('entity_counter')
          .addClass('entity_' + entity.uuid.uuidString)
          .attr('data-placement', 'top')
          .attr('data-toggle', 'tooltip')
          .attr('title', 'UUID ' + entity.uuid.uuidString)
          .html('Entity ' + counter)
          .tooltip();
        entity_div.append(entityCounter_span);

        var entityTotal_span = $('<span>')
          .addClass('entity_total')
          .html('(x' + entity.mentionIdList.length + ')');
        entity_div.append(entityTotal_span);

        var mentionId_ul = $('<ul class="list-inline">').addClass('entity_list');
        for (var mentionIdListIndex in entity.mentionIdList) {
          var mentionId = entity.mentionIdList[mentionIdListIndex];
          var mentionId_li = $('<li>')
            .html('<span class="coref_mention mention_' + mentionId.uuidString + '">' + comm.getTokensForEntityMentionID(mentionId).join(" ") + '</span>');
          mentionId_ul.append(mentionId_li);
        }
        entity_div.append(mentionId_ul);

        entityTable_div.append(entity_div);
      }
    }
  }
};


/** Add mouseover event handlers for EntityMentions
 *
 * For each Entity in the given Communication, find all the token
 * <span>'s associated with the EntityMentions for that Entity, and
 * add mouseover event handlers to those <span>'s.
 *
 * @param {Communication} comm
 */
QL.addEntityMouseoverHighlighting = function(comm) {
  /**
   * @param {MouseEvent} event
   */
  function addHighlightToEntity(event) {
    $(event.data.entity_selector).addClass("highlighted_entity");
  }

  /**
   * @param {MouseEvent} event
   */
  function addHighlightToMention(event) {
    $(event.data.mention_selector).addClass("highlighted_mention");
  }

  /**
   * @param {MouseEvent} event
   */
  function removeHighlightFromEntity(event) {
    $(event.data.entity_selector).removeClass("highlighted_entity");
  }

  /**
   * @param {MouseEvent} event
   */
  function removeHighlightFromMention(event) {
    $(event.data.mention_selector).removeClass("highlighted_mention");
  }

  function toggleSelectedEntity(event) {
    $(event.data.entity_selector).toggleClass("selected_entity");
  }

  // Add mouseover functions for all elements linked to an entity
  if (comm.entitySetList) {
    for (var entitySetListIndex in comm.entitySetList) {
      for (var entityListIndex in comm.entitySetList[entitySetListIndex].entityList) {
        var entity = comm.entitySetList[entitySetListIndex].entityList[entityListIndex];
        $('.entity_' + entity.uuid.uuidString)
          .click({ entity_selector: '.entity_' + entity.uuid.uuidString }, toggleSelectedEntity)
          .mouseenter({ entity_selector: '.entity_' + entity.uuid.uuidString }, addHighlightToEntity)
          .mouseleave({ entity_selector: '.entity_' + entity.uuid.uuidString }, removeHighlightFromEntity);

        // Add mouseover functions for all elements linked to a mention of an entity in entitySet.
        // Mouseover functions will not be added to any mentions - such as value mentions - that are
        // not linked to an entity in entitySet.
        for (var i = 0; i < entity.mentionIdList.length; i++) {
          var entityMentionId = entity.mentionIdList[i];
          $('.mention_' + entityMentionId.uuidString)
            .click({ entity_selector: '.entity_' + entity.uuid.uuidString }, toggleSelectedEntity)
            .mouseenter({ mention_selector: '.mention_'+entityMentionId.uuidString }, addHighlightToMention)
            .mouseleave({ mention_selector: '.mention_'+entityMentionId.uuidString }, removeHighlightFromMention);
        }
      }
    }
  }
};


/** Function takes a token string, returns a "cleaned" version of that string
 * @param {String} tokenText
 * @returns {String}
 */
QL.cleanedTokenText = function(tokenText) {
  // Convert Penn Treebank-style symbols for brackets to bracket characters
  //   http://www.cis.upenn.edu/~treebank/tokenization.html
  switch(tokenText) {
    case '-LRB-':
      return '(';
    case '-RRB-':
      return ')';
    case '-LSB-':
      return '[';
    case '-RSB-':
      return ']';
    case '-LCB-':
      return '{';
    case '-RCB-':
      return '}';
    default:
      return tokenText;
  }
};
