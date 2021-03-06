/*+***********************************************************************************
 * The contents of this file are subject to the vtiger CRM Public License Version 1.0
 * ("License"); You may not use this file except in compliance with the License
 * The Original Code is:  vtiger CRM Open Source
 * The Initial Developer of the Original Code is vtiger.
 * Portions created by vtiger are Copyright (C) vtiger.
 * All Rights Reserved.
 *************************************************************************************/

jQuery.Class("Vtiger_List_Js",{

	listInstance : false,
	
	getRelatedModulesContainer : false,

	massEditPreSave : 'Vtiger.MassEdit.PreSave',

	getInstance: function(){
		if(Vtiger_List_Js.listInstance == false){
			var module = app.getModuleName();
			var parentModule = app.getParentModuleName();
			if(parentModule == 'Settings'){
				var moduleClassName = parentModule+"_"+module+"_List_Js";
				if(typeof window[moduleClassName] == 'undefined'){
					moduleClassName = module+"_List_Js";
				}
				var fallbackClassName = parentModule+"_Vtiger_List_Js";
				if(typeof window[fallbackClassName] == 'undefined') {
					fallbackClassName = "Vtiger_List_Js";
				}
			} else {
				moduleClassName = module+"_List_Js";
				fallbackClassName = "Vtiger_List_Js";
			}
			if(typeof window[moduleClassName] != 'undefined'){
				var instance = new window[moduleClassName]();
			}else{
				var instance = new window[fallbackClassName]();
			}
			Vtiger_List_Js.listInstance = instance;
			return instance;
		}
		return Vtiger_List_Js.listInstance;
	},
	/*
	 * function to trigger send Email
	 * @params: send email url , module name.
	 */
	triggerSendEmail : function(massActionUrl, module, params){
		var listInstance = Vtiger_List_Js.getInstance();
		var validationResult = listInstance.checkListRecordSelected();
		if(validationResult != true){
			var selectedIds = listInstance.readSelectedIds(true);
			var excludedIds = listInstance.readExcludedIds(true);
			var cvId = listInstance.getCurrentCvId();
			var postData = {
				"viewname" : cvId,
				"selected_ids":selectedIds,
				"excluded_ids" : excludedIds
			};

			  var listViewInstance = Vtiger_List_Js.getInstance();
			  var searchValue = listViewInstance.getAlphabetSearchValue();

			if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
				postData['search_key'] = listViewInstance.getAlphabetSearchField();
				postData['search_value'] = searchValue;
				postData['operator'] = listViewInstance.getSearchOperator();
			}
			jQuery.extend(postData,params);
			var actionParams = {
				"type":"POST",
				"url":massActionUrl,
				"dataType":"html",
				"data" : postData
			};

			Vtiger_Index_Js.showComposeEmailPopup(actionParams);
		} else {
			listInstance.noRecordSelectedAlert();
		}

	},
	/*
	 * function to trigger Send Sms
	 * @params: send email url , module name.
	 */
	triggerSendSms : function(massActionUrl, module){
		var listInstance = Vtiger_List_Js.getInstance();
		var validationResult = listInstance.checkListRecordSelected();
		if(validationResult != true){
			Vtiger_Helper_Js.checkServerConfig(module).then(function(data){
				if(data == true){
					Vtiger_List_Js.triggerMassAction(massActionUrl);
				} else {
					alert(app.vtranslate('JS_SMS_SERVER_CONFIGURATION'));
				}
			});
		} else {
			listInstance.noRecordSelectedAlert();
		}

	},
	/* ED150628
	 * function to trigger Assign entities to selected contacts
	 * also used to unassign
	 * @params: assign entity url.
	 */
	triggerAssignRelatedEntities : function(massActionUrl, relatedModuleName){
		var listInstance = Vtiger_List_Js.getInstance();
		var validationResult = listInstance.checkListRecordSelected();
		if(validationResult != true){
			var forUnassign = /unassign/.test(massActionUrl);
			this.showSelectRelationPopup(relatedModuleName, forUnassign).then(function(data){
				var ids = [];
				for (var id in data) {
					ids.push(id);
				}
				if (ids && ids.length > 0){
					massActionUrl += '&related_ids=' + ids.join(',');
					Vtiger_List_Js.triggerMassAction(massActionUrl, Vtiger_List_Js.postAssignCritere4DEdit);
				}
			});
		} else {
			listInstance.noRecordSelectedAlert();
		}
	},
	/* ED150628 : sélection d'enregistrements
	 * @param relatedModulename
	 * @param addSourceParameters : used for unassignement, to show only related records
	 */ 
	showSelectRelationPopup : function(relatedModulename, addSourceParameters){
		var aDeferred = jQuery.Deferred();
		var thisInstance = this;
		var popupInstance = Vtiger_Popup_Js.getInstance();
		var parameters = {
			'module' : relatedModulename,
			'src_module' : app.getModuleName(),
			'src_record' : 0,//this.parentRecordId,
			'multi_select' : !!addSourceParameters
		}
		if (addSourceParameters){
			var listInstance = Vtiger_List_Js.getInstance()
			, selectedIds = listInstance.readSelectedIds(true)
			, excludedIds = listInstance.readExcludedIds(true)
			, cvId = listInstance.getCurrentCvId();
			jQuery.extend(parameters, {
				"src_viewname" : cvId,
				"src_selected_ids":selectedIds,
				"src_excluded_ids" : excludedIds
			});
			var searchValue = listInstance.getAlphabetSearchValue();
			if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
				jQuery.extend(parameters, {
					'src_search_key' : listInstance.getRequestSearchField('string'),
					'src_search_value' : (typeof searchValue == 'object' ? JSON.stringify(searchValue) : searchValue),
					'src_operator' : listInstance.getSearchOperator('string')
				});
			}
		}
		popupInstance.show(parameters, function(responseString){
				//jQuery('<pre/>').html(responseString).dialog({ title: "showSelectRelationPopup"});
				var responseData = JSON.parse(responseString);
				aDeferred.resolve(responseData);
			}
		);
		return aDeferred.promise();
	},
	
	postAssignCritere4DEdit : function(massEditContainer) {
		massEditContainer.find('form').on('submit', function(e){
			e.preventDefault();
			var form = jQuery(e.currentTarget);
			
			var listInstance = Vtiger_List_Js.getInstance();
			listInstance.massActionSave(form).then(
				function(data) {
					//ED150618
					if (data.error)
						data.result = data.error.message;
					if (typeof data.result === 'string') {
						var message = data.result;
						var params = {
							text: message,
							type: data.success ? 'info' : 'error'
						};
						Vtiger_Helper_Js.showMessage(params);
					}
					if (data.success){
						listInstance.getListViewRecords();
						Vtiger_List_Js.clearList();
					}
				},
				function(error,err){
					var params = {
						text: error,
						type: 'error'
					};
					Vtiger_Helper_Js.showMessage(params);
				}
			);
		});
	},
	
	
	
	/*
	 * function to trigger 'show email list'
	 * @params: send email url , module name.
	 *
	 * ED150227
	 */
	triggerShowEmailList : function(massActionUrl, module, params){
		var listInstance = Vtiger_List_Js.getInstance();
		var validationResult = listInstance.checkListRecordSelected();
		if(validationResult != true){
			var selectedIds = listInstance.readSelectedIds(true);
			var excludedIds = listInstance.readExcludedIds(true);
			var cvId = listInstance.getCurrentCvId();
			var postData = {
				"viewname" : cvId,
				"selected_ids":selectedIds,
				"excluded_ids" : excludedIds
			};

			var listViewInstance = Vtiger_List_Js.getInstance();
			var searchValue = listViewInstance.getAlphabetSearchValue();

			if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
				postData['search_key'] = listViewInstance.getRequestSearchField();
				postData['search_value'] = searchValue;
				postData['operator'] = listViewInstance.getSearchOperator();
			}
			jQuery.extend(postData,params);
			var actionParams = {
				"type":"POST",
				"url":massActionUrl,
				"dataType":"html",
				"data" : postData
			};

			Vtiger_Index_Js.showEmailListPopup(actionParams);
		} else {
			listInstance.noRecordSelectedAlert();
		}

	},
	
	triggerTransferOwnership : function(massActionUrl){
		var thisInstance = this;
		var listInstance = Vtiger_List_Js.getInstance();
		var validationResult = listInstance.checkListRecordSelected();
		if(validationResult != true){
			thisInstance.getRelatedModulesContainer = false;
			var actionParams = {
				"type":"POST",
				"url":massActionUrl,
				"dataType":"html",
				"data" : {}
			};
			AppConnector.request(actionParams).then(
				function(data) {
					if(data) {
						var callback = function(data) {
							var params = app.validationEngineOptions;
							params.onValidationComplete = function(form, valid){
								if(valid){
									thisInstance.transferOwnershipSave(form)
								}
								return false;
							}
							jQuery('#changeOwner').validationEngine(app.validationEngineOptions);
						}
						app.showModalWindow(data, function(data){
							var selectElement = thisInstance.getRelatedModuleContainer();
							app.changeSelectElementView(selectElement, 'select2');
							if(typeof callback == 'function'){
								callback(data);
							}
						});
					}
				}
			);
		} else {
			listInstance.noRecordSelectedAlert();
		}
	},
	
	transferOwnershipSave : function (form){
		var listInstance = Vtiger_List_Js.getInstance();
		var selectedIds = listInstance.readSelectedIds(true);
		var excludedIds = listInstance.readExcludedIds(true);
		var cvId = listInstance.getCurrentCvId();
		var transferOwner = jQuery('#transferOwnerId').val();
		var relatedModules = jQuery('#related_modules').val();

		var params = {
			'module': app.getModuleName(),
			'action' : 'TransferOwnership',
			"viewname" : cvId,
			"selected_ids":selectedIds,
			"excluded_ids" : excludedIds,
			'transferOwnerId' : transferOwner,
			'related_modules' : relatedModules
		}
		AppConnector.request(params).then(
			function(data) {
				if(data.success){
					app.hideModalWindow();
					var params = {
						title : app.vtranslate('JS_MESSAGE'),
						text: app.vtranslate('JS_RECORDS_TRANSFERRED_SUCCESSFULLY'),
						animation: 'show',
						type: 'info'
					};
					Vtiger_Helper_Js.showPnotify(params);
					listInstance.getListViewRecords();
					Vtiger_List_Js.clearList();
				}
			}
		);
	},
	
	/*
	 * Function to get the related module container 
	 */
	getRelatedModuleContainer  : function(){
		if(this.getRelatedModulesContainer == false){
			this.getRelatedModulesContainer = jQuery('#related_modules'); 
		}
		return this.getRelatedModulesContainer;
	},

	massDeleteRecords : function(url,instance) {
		var	listInstance = Vtiger_List_Js.getInstance();
		if(typeof instance != "undefined"){
			listInstance = instance;
		}
		var validationResult = listInstance.checkListRecordSelected();
		if(validationResult != true){
			// Compute selected ids, excluded ids values, along with cvid value and pass as url parameters
			var selectedIds = listInstance.readSelectedIds(true);
			var excludedIds = listInstance.readExcludedIds(true);
			var cvId = listInstance.getCurrentCvId();
			var message = app.vtranslate('LBL_MASS_DELETE_CONFIRMATION');
			Vtiger_Helper_Js.showConfirmationBox({'message' : message}).then(
				function(e) {

					var deleteURL = url+'&viewname='+cvId+'&selected_ids='+selectedIds+'&excluded_ids='+excludedIds;
					var listViewInstance = Vtiger_List_Js.getInstance();
					var searchValue = listViewInstance.getAlphabetSearchValue();
		
					if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
						deleteURL += '&search_key='+listViewInstance.getRequestSearchField('string')
							+ '&search_value='+(typeof searchValue == 'object' ? JSON.stringify(searchValue) : searchValue)
							+ '&operator='+listViewInstance.getSearchOperator('string');
					}
					var deleteMessage = app.vtranslate('JS_RECORDS_ARE_GETTING_DELETED');
					var progressIndicatorElement = jQuery.progressIndicator({
						'message' : deleteMessage,
						'position' : 'html',
						'blockInfo' : {
							'enabled' : true
						}
					});
					AppConnector.request(deleteURL).then(
						function() {
							progressIndicatorElement.progressIndicator({
								'mode' : 'hide'
							});
							listInstance.postMassDeleteRecords();
						}
					);
				},
				function(error, err){
				Vtiger_List_Js.clearList();
				})
		} else {
			listInstance.noRecordSelectedAlert();
		}
	},



	deleteRecord : function(recordId) {
		var listInstance = Vtiger_List_Js.getInstance();
		var message = app.vtranslate('LBL_DELETE_CONFIRMATION');
		Vtiger_Helper_Js.showConfirmationBox({'message' : message}).then(
			function(e) {
				var module = app.getModuleName();
				var postData = {
					"module": module,
					"action": "DeleteAjax",
					"record": recordId,
					"parent": app.getParentModuleName()
				}
				var deleteMessage = app.vtranslate('JS_RECORD_GETTING_DELETED');
				var progressIndicatorElement = jQuery.progressIndicator({
					'message' : deleteMessage,
					'position' : 'html',
					'blockInfo' : {
						'enabled' : true
					}
				});
				AppConnector.request(postData).then(
					function(data){
						progressIndicatorElement.progressIndicator({
							'mode' : 'hide'
						})
						if(data.success) {
							var orderBy = jQuery('#orderBy').val();
							var sortOrder = jQuery("#sortOrder").val();
							var urlParams = {
								"orderby": orderBy,
								"sortorder": sortOrder
							};
							if (data.result.viewname) {
								urlParams.viewname = data.result.viewname;
							}
							jQuery('#recordsCount').val('');
							jQuery('#totalPageCount').text('');
							listInstance.getListViewRecords(urlParams).then(function(){
								listInstance.updatePagination();
							});
						} else {
							var  params = {
								text : app.vtranslate(data.error.message),
								title : app.vtranslate('JS_LBL_PERMISSION')
							}
							Vtiger_Helper_Js.showPnotify(params);
						}
					},
					function(error,err){

					}
				);
			},
			function(error, err){
			}
		);
	},


	triggerMassAction : function(massActionUrl, callBackFunction, beforeShowCb, css) {

		//TODO : Make the paramters as an object
		if(typeof beforeShowCb == 'undefined') {
			beforeShowCb = function(){return true;};
		}

		if(typeof beforeShowCb == 'object') {
			css = beforeShowCb;
			beforeShowCb = function(){return true;};
		}
		var listInstance = Vtiger_List_Js.getInstance();
		var validationResult = listInstance.checkListRecordSelected();
		if(validationResult != true){
			// Compute selected ids, excluded ids values, along with cvid value and pass as url parameters
			var selectedIds = listInstance.readSelectedIds(true);
			var excludedIds = listInstance.readExcludedIds(true);
			var cvId = listInstance.getCurrentCvId();
			var postData = {
				"viewname" : cvId,
				"selected_ids":selectedIds,
				"excluded_ids" : excludedIds
			};
	
			var listViewInstance = Vtiger_List_Js.getInstance();
			var searchValue = listViewInstance.getAlphabetSearchValue();
	
			if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
				postData['search_key'] = listViewInstance.getRequestSearchField();
				postData['search_value'] = searchValue;
				postData['operator'] = listViewInstance.getSearchOperator();
				}
	
			var actionParams = {
				"type":"POST",
				"url":massActionUrl,
				"dataType":"html",
				"data" : postData
			};
	
			if(typeof css == 'undefined'){
				css = {};
			}
			css = jQuery.extend({'text-align' : 'left'},css);
	
			var loadingMessage = jQuery('.listViewLoadingMsg').text();
			var progressIndicatorElement = jQuery.progressIndicator({
				'message' : loadingMessage,
				'position' : 'html',
				'blockInfo' : {
					'enabled' : true
				}
			});
			
			AppConnector.request(actionParams).then(
				function(data) {
					progressIndicatorElement.progressIndicator({
						'mode' : 'hide'
					})
					if(data) {
						var result = beforeShowCb(data);
						if(!result) {
							return;
						}
						app.showModalWindow(data,function(data){
							if(typeof callBackFunction == 'function'){
								callBackFunction(data);
								//listInstance.triggerDisplayTypeEvent();
							}
						},css)
	
					}
				},
				function(error,err){
					progressIndicatorElement.progressIndicator({
						'mode' : 'hide'
					})
	
				}
			);
		} else {
			listInstance.noRecordSelectedAlert();
		}

	},

	/* ED151213
	 * Exécute une requête action et recharge, sans interaction
	 */
	triggerMassUpdate : function(massEditUrl, confirmMsg) {
		if (confirmMsg) {
			var thisInstance = this
			, message = app.vtranslate(confirmMsg);
			Vtiger_Helper_Js.showConfirmationBox({'message' : message}).then(function(){
				thisInstance.triggerMassUpdate(massEditUrl, false);
			});
			return;
		}
		Vtiger_List_Js.triggerMassAction(massEditUrl, false, function(data){
			var listInstance = Vtiger_List_Js.getInstance()
			, msg = 'Ok';
			
			if (typeof data === 'string'
			&& /^\{[\s\S]*\}$/.test(data)) {
				data = eval('('+data+')');
				if (data.result !== true) {
					msg = data.result;
				}
			}
			else
				msg = data;
			Vtiger_Helper_Js.showMessage(msg);
			
			listInstance.getListViewRecords();
			Vtiger_List_Js.clearList();
		
		});
	},

	triggerMassEdit : function(massEditUrl) {
		Vtiger_List_Js.triggerMassAction(massEditUrl, function(container){
			var massEditForm = container.find('#massEdit');
			massEditForm.validationEngine(app.validationEngineOptions);
			var listInstance = Vtiger_List_Js.getInstance();
			listInstance.inactiveFieldValidation(massEditForm);
			listInstance.registerReferenceFieldsForValidation(massEditForm);
			listInstance.registerFieldsForValidation(massEditForm);
			listInstance.registerEventForTabClick(massEditForm);
			listInstance.registerRecordAccessCheckEvent(massEditForm);
			var editInstance = Vtiger_Edit_Js.getInstance();
			editInstance.registerBasicEvents(massEditForm);
			//To remove the change happended for select elements due to picklist dependency
			container.find('select').trigger('change',{'forceDeSelect':true});
			listInstance.postMassEdit(container);

			listInstance.registerSlimScrollMassEdit();
			return false;
		},{'width':'65%'});
	},

	/*
	 * function to trigger export action
	 * returns UI
	 */
	triggerExportAction :function(exportActionUrl){
		var listInstance = Vtiger_List_Js.getInstance();
		// Compute selected ids, excluded ids values, along with cvid value and pass as url parameters
		var selectedIds = listInstance.readSelectedIds(true);
		var excludedIds = listInstance.readExcludedIds(true);
		var cvId = listInstance.getCurrentCvId();
		var pageNumber = jQuery('#pageNumber').val();

		exportActionUrl += '&selected_ids='+selectedIds+'&excluded_ids='+excludedIds+'&viewname='+cvId+'&page='+pageNumber;
	
		var listViewInstance = Vtiger_List_Js.getInstance();
		var searchValue = listViewInstance.getAlphabetSearchValue();

		if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
			exportActionUrl += '&search_key='+listViewInstance.getRequestSearchField('string')
				+'&search_value='+(typeof searchValue == 'object' ? JSON.stringify(searchValue) : searchValue)
				+'&operator='+listViewInstance.getSearchOperator('string');
		}

		var orderBy = jQuery('#orderBy').val();
		var sortOrder = jQuery("#sortOrder").val();

		if(typeof orderBy != "undefined") {//tmp
			exportActionUrl += '&orderby='+orderBy//tmp
				+'&sortorder='+((typeof sortOrder == "undefined") ? 'ASC' : sortOrder);//tmp
		}
		    window.location.href = exportActionUrl;
	},

	/* ED150912
	 * function to load an url with all filters as parameters
	 * returns UI
	 */
	triggerUrlActionWithDefaultValues :function(event, actionUrl, massMove){
		var listInstance = Vtiger_List_Js.getInstance();
		
		var cvId = listInstance.getCurrentCvId();
		var urlParams = listInstance.getHeadersFiltersUrlParams(event, {
			"viewname" : cvId,
			"search_key" : [],
			"search_value" : [],
			"search_input" : [],
			"operator" : []
		});
		
		for (var i = 0; i < urlParams.search_key.length; i++) {
			//TODO if not key already in url
			actionUrl += '&' + urlParams.search_key[i] + '=' + encodeURI(urlParams.search_value[i]);
		}
		
		// Compute selected ids, excluded ids values, along with cvid value and pass as url parameters
		if (massMove) {
			var selectedIds = listInstance.readSelectedIds(true);
			var excludedIds = listInstance.readExcludedIds(true);
			var pageNumber = jQuery('#pageNumber').val();
	
			actionUrl += '&selected_ids='+selectedIds+'&excluded_ids='+excludedIds+'&viewname='+cvId+'&page='+pageNumber;
		}
		
	    window.location.href = actionUrl;
	},

	//ED150912
	triggerAddRecord : function( event, url ) {
		this.triggerUrlActionWithDefaultValues( event, url );
	},
	
	/**
	 * Function to reload list
	 */
	clearList : function() {
		jQuery('#deSelectAllMsg').trigger('click');
		jQuery("#selectAllMsgDiv").hide();
	},

	showDuplicateSearchForm : function(url) {
		
		/*ED150626*/
		var listInstance = Vtiger_List_Js.getInstance();
		// Compute selected ids, excluded ids values, along with cvid value and pass as url parameters
		var selectedIds = listInstance.readSelectedIds(true);
		var excludedIds = listInstance.readExcludedIds(true);
		var cvId = listInstance.getCurrentCvId();
		var pageNumber = jQuery('#pageNumber').val();

		url += '&selected_ids='+selectedIds+'&excluded_ids='+excludedIds+'&viewname='+cvId+'&page='+pageNumber;
	
		var listViewInstance = Vtiger_List_Js.getInstance();
		var searchValue = listViewInstance.getAlphabetSearchValue();

		if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
			url += '&search_key='+listViewInstance.getRequestSearchField('string')
				+'&search_value='+(typeof searchValue == 'object' ? JSON.stringify(searchValue) : searchValue)
				+'&operator='+listViewInstance.getSearchOperator('string');
		}
		
		app.showModalWindow("", url, function() {
			Vtiger_List_Js.registerDuplicateSearchButtonEvent();
		});
	},

	/**
	 * Function that will enable Duplicate Search Find button
	 */
	registerDuplicateSearchButtonEvent : function() {
		jQuery('#fieldList').on('change', function(e) {
			var value = jQuery(e.currentTarget).val();
			var button = jQuery('#findDuplicate').find('button[type="submit"]');
			if(value != null) {
				button.attr('disabled', false);
			} else {
				button.attr('disabled', true);
			}
		})
	}
},{

	//contains the List View element.
	listViewContainer : false,

	//Contains list view top menu element
	listViewTopMenuContainer : false,

	//Contains list view content element
	listViewContentContainer : false,

	//Contains filter Block Element
	filterBlock : false,

	filterSelectElement : false,


	getListViewContainer : function() {
		if(this.listViewContainer == false){
			this.listViewContainer = jQuery('div.listViewPageDiv');
		}
		return this.listViewContainer;
	},

	getListViewTopMenuContainer : function(){
		if(this.listViewTopMenuContainer == false){
			this.listViewTopMenuContainer = jQuery('.listViewTopMenuDiv');
		}
		return this.listViewTopMenuContainer;
	},

	getListViewContentContainer : function(){
		if(this.listViewContentContainer == false){
			this.listViewContentContainer = jQuery('.listViewContentDiv');
		}
		return this.listViewContentContainer;
	},

	getFilterBlock : function(){
		if(this.filterBlock == false){
			var filterSelectElement = this.getFilterSelectElement();
            if(filterSelectElement.length <= 0) {
                this.filterBlock = jQuery();
            }else if(filterSelectElement.is('select')){
                this.filterBlock = filterSelectElement.data('select2').dropdown;
            }
		}
		return this.filterBlock;
	},

	getFilterSelectElement : function() {

		if(this.filterSelectElement == false) {
			this.filterSelectElement = jQuery('#customFilter');
		}
		return this.filterSelectElement;
	},


	getDefaultParams : function() {
		var pageNumber = jQuery('#pageNumber').val();
		var module = app.getModuleName();
		var parent = app.getParentModuleName();
		var cvId = this.getCurrentCvId();
		var viewName = app.getViewName();//ED151005
		var orderBy = jQuery('#orderBy').val();
		var sortOrder = jQuery("#sortOrder").val();
		var params = {
			'module': module,
			'parent' : parent,
			'page' : pageNumber,
			'view' : viewName,
			'viewname' : cvId,
			'orderby' : orderBy,
			'sortorder' : sortOrder
		}

		var searchValue = this.getAlphabetSearchValue();
	
		if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
		    params['search_key'] = this.getRequestSearchField();
		    params['search_value'] = searchValue;
		    params['operator'] = this.getSearchOperator();
		}
		return params;
	},

	/*
	 * Function which will give you all the list view params
	 */
	getListViewRecords : function(urlParams) {
		var aDeferred = jQuery.Deferred();
		if(typeof urlParams == 'undefined') {
			urlParams = {};
		}

		var thisInstance = this;
		var loadingMessage = jQuery('.listViewLoadingMsg').text();
		var progressIndicatorElement = jQuery.progressIndicator({
			'message' : loadingMessage,
			'position' : 'html',
			'blockInfo' : {
				'enabled' : true
			}
		});

		var defaultParams = this.getDefaultParams();
		urlParams = jQuery.extend(defaultParams, urlParams);
		AppConnector.requestPjax(urlParams).then(
			function(data){
				progressIndicatorElement.progressIndicator({
					'mode' : 'hide'
				})
                jQuery('#listViewContents').html(data);
				thisInstance.calculatePages().then(function(data){
					//thisInstance.triggerDisplayTypeEvent();
					Vtiger_Helper_Js.showHorizontalTopScrollBar();

					var selectedIds = thisInstance.readSelectedIds();
					if(selectedIds != ''){
						if(selectedIds == 'all'){
							jQuery('.listViewEntriesCheckBox').each( function(index,element) {
								jQuery(this).attr('checked', true).closest('tr').addClass('highlightBackgroundColor');
							});
							jQuery('#deSelectAllMsgDiv').show();
							var excludedIds = thisInstance.readExcludedIds();
							if(excludedIds != ''){
								jQuery('#listViewEntriesMainCheckBox').attr('checked',false);
								jQuery('.listViewEntriesCheckBox').each( function(index,element) {
									if(jQuery.inArray(jQuery(element).val(),excludedIds) != -1){
										jQuery(element).attr('checked', false).closest('tr').removeClass('highlightBackgroundColor');
									}
								});
							}
						} else {
							jQuery('.listViewEntriesCheckBox').each( function(index,element) {
								if(jQuery.inArray(jQuery(element).val(),selectedIds) != -1){
									jQuery(this).attr('checked', true).closest('tr').addClass('highlightBackgroundColor');
								}
							});
						}
						thisInstance.checkSelectAll();
					}
					aDeferred.resolve(data);

					// Let listeners know about page state change.
					app.notifyPostAjaxReady();
				});
			},

			function(textStatus, errorThrown){
				aDeferred.reject(textStatus, errorThrown);
			}
		);
		return aDeferred.promise();
	},

	/**
	 * Function to calculate number of pages
	 */
	calculatePages : function() {
		var aDeferred = jQuery.Deferred();
		var element = jQuery('#totalPageCount');
		var totalPageNumber = element.text();
		if(totalPageNumber == ""){
			var totalRecordCount = jQuery('#totalCount').val();
			if(totalRecordCount != '') {
				var pageLimit = jQuery('#pageLimit').val();
				if(pageLimit == '0') pageLimit = 1;
				pageCount = Math.ceil(totalRecordCount/pageLimit);
				if(pageCount == 0){
					pageCount = 1;
				}
				element.text(pageCount);
				aDeferred.resolve();
				return aDeferred.promise();
			}
			this.getPageCount().then(function(data){
				var pageCount = data['result']['page'];
				if(pageCount == 0){
					pageCount = 1;
				}
				element.text(pageCount);
				aDeferred.resolve();
			});
		} else {
			aDeferred.resolve();
		}
		return aDeferred.promise();
	},

	/*
	 * Function to return alerts if no records selected.
	 */
	noRecordSelectedAlert : function(){
		return alert(app.vtranslate('JS_PLEASE_SELECT_ONE_RECORD'));
	},

	
	/*
	 * Function to check the view permission of a record after save
	 */
	registerRecordAccessCheckEvent : function(form) {

		form.on(Vtiger_List_Js.massEditPreSave, function(e) {
			var assignedToSelectElement = form.find('[name="assigned_user_id"][data-validation-engine]');
			if(assignedToSelectElement.length > 0){
				if(assignedToSelectElement.data('recordaccessconfirmation') == true) {
					return;
				}else{
					if(assignedToSelectElement.data('recordaccessconfirmationprogress') != true) {
						var recordAccess = assignedToSelectElement.find('option:selected').data('recordaccess');
						if(recordAccess == false) {
							var message = app.vtranslate('JS_NO_VIEW_PERMISSION_AFTER_SAVE');
							Vtiger_Helper_Js.showConfirmationBox({
								'message' : message
							}).then(
								function(e) {
									assignedToSelectElement.data('recordaccessconfirmation',true);
									assignedToSelectElement.removeData('recordaccessconfirmationprogress');
									form.submit();
								},
								function(error, err){
									assignedToSelectElement.removeData('recordaccessconfirmationprogress');
									e.preventDefault();
								});
							assignedToSelectElement.data('recordaccessconfirmationprogress',true);
						} else {
							return true;
						}
					}
				}
			} else{
				return true;
			}
			e.preventDefault();
		});
	},

	checkSelectAll : function(){
		var state = true;
		jQuery('.listViewEntriesCheckBox').each(function(index,element){
			if(jQuery(element).is(':checked')){
				state = true;
			}else{
				state = false;
				return false;
			}
		});
		if(state == true){
			jQuery('#listViewEntriesMainCheckBox').attr('checked',true);
		} else {
			jQuery('#listViewEntriesMainCheckBox').attr('checked', false);
		}
	},

	getRecordsCount : function(){
		var aDeferred = jQuery.Deferred();
		var recordCountVal = jQuery("#recordsCount").val();
		if(recordCountVal != ''){
			aDeferred.resolve(recordCountVal);
		} else {
			var count = '';
			var cvId = this.getCurrentCvId();
			var module = app.getModuleName();
			var parent = app.getParentModuleName();
			var postData = {
				"module": module,
				"parent": parent,
				"view": this.requestViewClass + "Ajax",
				"viewname": cvId,
				"mode": "getRecordsCount"
			}

			var searchValue = this.getAlphabetSearchValue();
			if((typeof searchValue != "undefined") && (searchValue.length > 0)) {
			    postData['search_key'] = this.getRequestSearchField();
			    postData['search_value'] = this.getAlphabetSearchValue();
			    postData['operator'] = this.getSearchOperator();
			}

			AppConnector.request(postData).then(
				function(data) {
					var response = JSON.parse(data);
					jQuery("#recordsCount").val(response['result']['count']);
					count =  response['result']['count'];
					aDeferred.resolve(count);
				},
				function(error,err){

				}
			);
		}

		return aDeferred.promise();
	},

	getSelectOptionFromChosenOption : function(liElement){
		var classNames = liElement.attr("class");
		var classNamesArr = classNames.split(" ");
		var currentOptionId = '';
		jQuery.each(classNamesArr,function(index,element){
			if(element.match("^filterOptionId")){
				currentOptionId = element;
				return false;
			}
		});
		return jQuery('#'+currentOptionId);
	},

	readSelectedIds : function(decode){
		var cvId = this.getCurrentCvId();
		var selectedIdsElement = jQuery('#selectedIds');
		var selectedIdsDataAttr = cvId+'Selectedids';
		var selectedIdsElementDataAttributes = selectedIdsElement.data();
		if (!(selectedIdsDataAttr in selectedIdsElementDataAttributes) ) {
			var selectedIds = new Array();
			this.writeSelectedIds(selectedIds);
		} else {
			selectedIds = selectedIdsElementDataAttributes[selectedIdsDataAttr];
		}
		if(decode == true){
			if(typeof selectedIds == 'object'){
				return JSON.stringify(selectedIds);
			}
		}
		return selectedIds;
	},
	readExcludedIds : function(decode){
		var cvId = this.getCurrentCvId();
		var exlcudedIdsElement = jQuery('#excludedIds');
		var excludedIdsDataAttr = cvId+'Excludedids';
		var excludedIdsElementDataAttributes = exlcudedIdsElement.data();
		if(!(excludedIdsDataAttr in excludedIdsElementDataAttributes)){
			var excludedIds = new Array();
			this.writeExcludedIds(excludedIds);
		}else{
			excludedIds = excludedIdsElementDataAttributes[excludedIdsDataAttr];
		}
		if(decode == true){
			if(typeof excludedIds == 'object') {
				return JSON.stringify(excludedIds);
			}
		}
		return excludedIds;
	},

	writeSelectedIds : function(selectedIds){
		var cvId = this.getCurrentCvId();
		jQuery('#selectedIds').data(cvId+'Selectedids',selectedIds);
	},

	writeExcludedIds : function(excludedIds){
		var cvId = this.getCurrentCvId();
		jQuery('#excludedIds').data(cvId+'Excludedids',excludedIds);
	},

	getCurrentCvId : function(){
		return jQuery('#customFilter').find('option:selected').data('id');
	},

	/* ED150412 added #requestSearchKey
	 */
	getRequestSearchField : function(format_type) {
		var value = jQuery("#requestSearchKey").val();
		if (value){
			/*ED150414
			 * tests if it is a json value (eg ["fieldname1", "fieldname2"] )
			*/
			if (typeof value === 'string'
			&& /^\[(\".*\",?)*\]$/.test(value))
				if (format_type == 'string') 
					return this.unescapeHtml(value);
				else
					try { return eval(value); } catch(ex) {}
			return value;
		}
		return jQuery("#alphabetSearchKey").val();
	},

	/* ED150412 attention : this does not take care of header filter (use getRequestSearchField)
	 */
	getAlphabetSearchField : function() {
		return jQuery("#alphabetSearchKey").val();
	},

	getAlphabetSearchValue : function(format_type) {
		var value = jQuery("#alphabetValue").val();
		/*ED150414
		 * tests if it is a json value (eg [">10", 1] )
		 * TODO : isn't it dangerous ?
		*/
		if (typeof value === 'string'
		&& /^\[[\s\S]*\]$/.test(value))
			if (format_type == 'string') 
				return this.unescapeHtml(value);
			else
				try { return eval(this.unescapeHtml(value)); } catch(ex) {}
		return value;
	},

	/* ED150412 
	 */
	getSearchOperator : function(format_type) {
		var value = jQuery("#Operator").val();
		if (!value)
			return 's';
		if (typeof value === 'string'
		&& /^\[[\s\S]*\]$/.test(value))
			if (format_type == 'string') 
				return this.unescapeHtml(value);
			else
				try { return eval(value); } catch(ex) {}
		return value;
	},

	unescapeHtml : function(safe) {
		return safe.replace(/&amp;/g, '&')
		    .replace(/&lt;/g, '<')
		    .replace(/&gt;/g, '>')
		    .replace(/&quot;/g, '"')
		    .replace(/&#039;/g, "'");
	 },
	 
	/*
	 * Function to check whether atleast one record is checked
	 */
	checkListRecordSelected : function(){
		var selectedIds = this.readSelectedIds();
		if(typeof selectedIds == 'object' && selectedIds.length <= 0) {
			return true;
		}
		return false;
	},

	postMassEdit : function(massEditContainer) {
		var thisInstance = this;
		massEditContainer.find('form').on('submit', function(e){
			e.preventDefault();
			var form = jQuery(e.currentTarget);
			var invalidFields = form.data('jqv').InvalidFields;
			if(invalidFields.length == 0){
				form.find('[name="saveButton"]').attr('disabled',"disabled");
			}
			var invalidFields = form.data('jqv').InvalidFields;
			if(invalidFields.length > 0){
				return;
			}
			thisInstance.massActionSave(form, true).then(
				function(data) {
					//ED150618
					if (typeof data.result === 'string') {
						var message = data.result;
						var params = {
							text: message,
							type: data.success ? 'info' : 'error'
						};
						Vtiger_Helper_Js.showMessage(params);
					}
					thisInstance.getListViewRecords();
					Vtiger_List_Js.clearList();
				},
				function(error,err){
				}
			);
		});
	},

	massActionSave : function(form, isMassEdit){
		if(typeof isMassEdit == 'undefined') {
			isMassEdit = false;
		}
		var aDeferred = jQuery.Deferred();
		var massActionUrl = form.serializeFormData();
		if(isMassEdit) {
			var fieldsChanged = false;
            var massEditFieldList = jQuery('#massEditFieldsNameList').data('value');
			for(var fieldName in massEditFieldList){
                var fieldInfo = massEditFieldList[fieldName];

                var fieldElement = form.find('[name="'+fieldInfo.name+'"]');
                if(fieldInfo.type == "reference") {
                    //get the element which will be shown which has "_display" appended to actual field name
                    fieldElement = form.find('[name="'+fieldInfo.name+'_display"]');
                }else if(fieldInfo.type == "multipicklist") {
                    fieldElement = form.find('[name="'+fieldInfo.name+'[]"]');
                }

                //Not all fields will be enabled for mass edit
                if(fieldElement.length == 0) {
                    continue;
                }

                var validationElement = fieldElement.filter('[data-validation-engine]');
                //check if you have element enabled has changed
                if(validationElement.length == 0){
                    if(fieldInfo.type == "multipicklist") {
                        fieldName = fieldName+"[]";
                    }
                    delete massActionUrl[fieldName];
                    if(fieldsChanged != true){
                        fieldsChanged = false;
                    }
                } else {
                    fieldsChanged = true;
                }
			}
			if(massEditFieldList /* ED150930 */
			&& fieldsChanged == false){
				Vtiger_Helper_Js.showPnotify(app.vtranslate('NONE_OF_THE_FIELD_VALUES_ARE_CHANGED_IN_MASS_EDIT'));
				form.find('[name="saveButton"]').removeAttr('disabled');
				aDeferred.reject();
				return aDeferred.promise();
			}
			//on submit form trigger the massEditPreSave event
			var massEditPreSaveEvent = jQuery.Event(Vtiger_List_Js.massEditPreSave);
			form.trigger(massEditPreSaveEvent);
			if(massEditPreSaveEvent.isDefaultPrevented()) {
				form.find('[name="saveButton"]').removeAttr('disabled');
				aDeferred.reject();
				return aDeferred.promise();
			}
		}
		
		var loadingMessage = jQuery('.listViewLoadingMsg').text();
		var progressIndicatorElement = jQuery.progressIndicator({
			'message' : loadingMessage,
			'position' : 'html',
			'blockInfo' : {
				'enabled' : true
			}
		});
		
		AppConnector.request(massActionUrl).then(
			function(data) {
				progressIndicatorElement.progressIndicator({
					'mode' : 'hide'
				})
				app.hideModalWindow();
				aDeferred.resolve(data);
			},
			function(error,err){
				progressIndicatorElement.progressIndicator({
					'mode' : 'hide'
				})
				app.hideModalWindow();
				aDeferred.reject(error,err);
			}
		);
		return aDeferred.promise();
	},
	/*
	 * Function to register List view Page Navigation
	 */
	registerPageNavigationEvents : function(){
		var aDeferred = jQuery.Deferred();
		var thisInstance = this;
		
		
		 //ED141210 : ajout de , #listViewNextPageButton-bottom
		 jQuery('#listViewNextPageButton, #listViewNextPageButton-bottom').on('click',function(){
			var pageLimit = jQuery('#pageLimit').val();
			var noOfEntries = jQuery('#noOfEntries').val();
			if(noOfEntries == pageLimit){
				var orderBy = jQuery('#orderBy').val();
				var sortOrder = jQuery("#sortOrder").val();
				var cvId = thisInstance.getCurrentCvId();
				var urlParams = {
					"orderby": orderBy,
					"sortorder": sortOrder,
					"viewname": cvId
				}
				var pageNumber = jQuery('#pageNumber').val();
				var nextPageNumber = parseInt(parseFloat(pageNumber)) + 1;
				jQuery('#pageNumber').val(nextPageNumber);
				jQuery('#pageToJump').val(nextPageNumber);
				thisInstance.getListViewRecords(urlParams).then(
					function(data){
						thisInstance.updatePagination();
						aDeferred.resolve();
					},

					function(textStatus, errorThrown){
						aDeferred.reject(textStatus, errorThrown);
					}
				);
			}
			return aDeferred.promise();
		});
		 //ED141210
		jQuery('#listViewPreviousPageButton, #listViewPreviousPageButton-bottom').on('click',function(){
			  //var suffixe = this.id.replace(/^.+(\-(bottom))?$/, '$1');
			var aDeferred = jQuery.Deferred();
			var pageNumber = jQuery('#pageNumber').val();
			if(pageNumber > 1){
				var orderBy = jQuery('#orderBy').val();
				var sortOrder = jQuery("#sortOrder").val();
				var cvId = thisInstance.getCurrentCvId();
				var urlParams = {
					"orderby": orderBy,
					"sortorder": sortOrder,
					"viewname" : cvId
				}
				var previousPageNumber = parseInt(parseFloat(pageNumber)) - 1;
				jQuery('#pageNumber').val(previousPageNumber);
				jQuery('#pageToJump').val(previousPageNumber);
				thisInstance.getListViewRecords(urlParams).then(
					function(data){
						thisInstance.updatePagination();
						aDeferred.resolve();
					},

					function(textStatus, errorThrown){
						aDeferred.reject(textStatus, errorThrown);
					}
				);
			}
		});

		jQuery('#listViewPageJump').on('click',function(e){
			jQuery('#pageToJump').validationEngine('hideAll');
			var element = jQuery('#totalPageCount');
			var totalPageNumber = element.text();
			if(totalPageNumber == ""){
				var totalRecordCount = jQuery('#totalCount').val();
				if(totalRecordCount != '') {
					var recordPerPage = jQuery('#noOfEntries').val();
					if(recordPerPage == '0') recordPerPage = 1;
					pageCount = Math.ceil(totalRecordCount/recordPerPage);
					if(pageCount == 0){
						pageCount = 1;
					}
					element.text(pageCount);
					return;
				}
				element.progressIndicator({});
				thisInstance.getPageCount().then(function(data){
					var pageCount = data['result']['page'];
					if(pageCount == 0){
						pageCount = 1;
					}
					element.text(pageCount);
					element.progressIndicator({'mode': 'hide'});
			});
		}
		})

		jQuery('#listViewPageJumpDropDown').on('click','li',function(e){
			e.stopImmediatePropagation();
		}).on('keypress','#pageToJump',function(e){
			if(e.which == 13){
				e.stopImmediatePropagation();
				var element = jQuery(e.currentTarget);
				var response = Vtiger_WholeNumberGreaterThanZero_Validator_Js.invokeValidation(element);
				if(typeof response != "undefined"){
					element.validationEngine('showPrompt',response,'',"topLeft",true);
				} else {
					element.validationEngine('hideAll');
					var currentPageElement = jQuery('#pageNumber');
					var currentPageNumber = currentPageElement.val();
					var newPageNumber = parseInt(jQuery(e.currentTarget).val());
					var totalPages = parseInt(jQuery('#totalPageCount').text());
					if(newPageNumber > totalPages){
						var error = app.vtranslate('JS_PAGE_NOT_EXIST');
						element.validationEngine('showPrompt',error,'',"topLeft",true);
						return;
					}
					if(newPageNumber == currentPageNumber){
						var message = app.vtranslate('JS_YOU_ARE_IN_PAGE_NUMBER')+" "+newPageNumber;
						var params = {
							text: message,
							type: 'info'
						};
						Vtiger_Helper_Js.showMessage(params);
						return;
					}
					currentPageElement.val(newPageNumber);
					thisInstance.getListViewRecords().then(
						function(data){
							thisInstance.updatePagination();
							element.closest('.btn-group ').removeClass('open');
						},
						function(textStatus, errorThrown){
						}
					);
				}
				return false;
			}
		});
	},

	/**
	 * Function to get page count and total number of records in list
	 */
	getPageCount : function(){
		var aDeferred = jQuery.Deferred();
		var pageCountParams = this.getPageJumpParams();
		AppConnector.request(pageCountParams).then(
			function(data) {
				var response;
				if(typeof data != "object"){
					response = JSON.parse(data);
				} else{
					response = data;
				}
				aDeferred.resolve(response);
			},
			function(error,err){

			}
		);
		return aDeferred.promise();
	},

	/**
	 * Function to get Page Jump Params
	 */
	getPageJumpParams : function(){
		var params = this.getDefaultParams();
		params['view'] = this.requestViewClass + "Ajax";
		params['mode'] = "getPageCount";

		return params;
	},

	/**
	 * Function to update Pagining status
	 */
	updatePagination : function(){
		var previousPageExist = jQuery('#previousPageExist').val();
		var nextPageExist = jQuery('#nextPageExist').val();
		var previousPageButton = jQuery('#listViewPreviousPageButton,#listViewPreviousPageButton-bottom'); //ED141210
		var nextPageButton = jQuery('#listViewNextPageButton,#listViewNextPageButton-bottom'); //ED141210
		var pageJumpButton = jQuery('#listViewPageJump');
		var listViewEntriesCount = parseInt(jQuery('#noOfEntries').val());
		var pageStartRange = parseInt(jQuery('#pageStartRange').val());
		var pageEndRange = parseInt(jQuery('#pageEndRange').val());
		var pages = jQuery('#totalPageCount').text();

		if(pages == 1){
			pageJumpButton.attr('disabled',"disabled");
		}
		if(pages > 1){
			pageJumpButton.removeAttr('disabled');
		}
		if(previousPageExist != ""){
			previousPageButton.removeAttr('disabled');
		} else if(previousPageExist == "") {
			previousPageButton.attr("disabled","disabled");
		}

		if((nextPageExist != "") && (pages >1)){
			nextPageButton.removeAttr('disabled');
		} else if((nextPageExist == "") || (pages == 1)) {
			nextPageButton.attr("disabled","disabled");
		}
		if(listViewEntriesCount != 0){
			var pageNumberText = pageStartRange+" "+app.vtranslate('to')+" "+pageEndRange;
			jQuery('.pageNumbers').html(pageNumberText);
		} else {
			jQuery('.pageNumbers').html("");
		}
	},
	/*
	 * Function to register the event for changing the custom Filter
	 * Liste des 
	 */
	registerChangeCustomFilterEvent : function(){
		var thisInstance = this;
		var filterSelectElement = this.getFilterSelectElement();
		filterSelectElement.change(function(e){
			jQuery('#pageNumber').val("1");
			jQuery('#pageToJump').val('1');
			jQuery('#orderBy').val('');
			jQuery("#sortOrder").val('');
			var cvId = thisInstance.getCurrentCvId();
			selectedIds = new Array();
			excludedIds = new Array();

			  var urlParams ={
				       "viewname" : cvId,
				       //to make alphabetic search empty
				       "search_key" : thisInstance.getAlphabetSearchField(),
				       "search_value" : ""
			  }
			//Make the select all count as empty
			jQuery('#recordsCount').val('');
			//Make total number of pages as empty
			jQuery('#totalPageCount').text("");
			thisInstance.getListViewRecords(urlParams).then (function(){
				thisInstance.updatePagination();
            });
		});
	},

	/*
	 * Function to register the click event for list view main check box.
	 */
	registerMainCheckBoxClickEvent : function(){
		var listViewPageDiv = this.getListViewContainer();
		var thisInstance = this;
		listViewPageDiv.on('click','#listViewEntriesMainCheckBox',function(){
			var selectedIds = thisInstance.readSelectedIds();
			var excludedIds = thisInstance.readExcludedIds();
			if(jQuery('#listViewEntriesMainCheckBox').is(":checked")){
				var recordCountObj = thisInstance.getRecordsCount();
				recordCountObj.then(function(data){
					jQuery('#totalRecordsCount').text(data);
					if(jQuery("#deSelectAllMsgDiv").css('display') == 'none'){
						jQuery("#selectAllMsgDiv").show();
					}
				});

				jQuery('.listViewEntriesCheckBox').each( function(index,element) {
					jQuery(this).attr('checked', true).closest('tr').addClass('highlightBackgroundColor');
					if(selectedIds == 'all'){
						if((jQuery.inArray(jQuery(element).val(), excludedIds))!= -1){
							excludedIds.splice(jQuery.inArray(jQuery(element).val(),excludedIds),1);
						}
					} else if((jQuery.inArray(jQuery(element).val(), selectedIds)) == -1){
						selectedIds.push(jQuery(element).val());
					}
				});
			}else{
				jQuery("#selectAllMsgDiv").hide();
				jQuery('.listViewEntriesCheckBox').each( function(index,element) {
					jQuery(this).attr('checked', false).closest('tr').removeClass('highlightBackgroundColor');
				if(selectedIds == 'all'){
					excludedIds.push(jQuery(element).val());
					selectedIds = 'all';
				} else {
					selectedIds.splice( jQuery.inArray(jQuery(element).val(), selectedIds), 1 );
				}
				});
			}
			thisInstance.writeSelectedIds(selectedIds);
			thisInstance.writeExcludedIds(excludedIds);

		});
	},

	/*
	 * Function  to register click event for list view check box.
	 *
	 * ED150707 adds helper : checkboxing with CTRL down makes a range selection  
	 */
	registerCheckBoxClickEvent : function(){
		var listViewPageDiv = this.getListViewContainer();
		var thisInstance = this;
		listViewPageDiv.delegate('.listViewEntriesCheckBox','click',function(e){
			//ED150707 helper : checkboxing with MAJ key down makes a range selection 
			if (e.type){ //real event
				if (e.metaKey || e.shiftKey) {
					var founded = false
					, currentTarget = e.currentTarget
					, callback = arguments.callee; //this function
					
					if (!thisInstance.previous_listViewEntriesCheckBox) {
						//first checkbox
						thisInstance.previous_listViewEntriesCheckBox = jQuery('.listViewEntriesCheckBox:first').get(0);
						if(thisInstance.previous_listViewEntriesCheckBox.checked != currentTarget.checked){
							thisInstance.previous_listViewEntriesCheckBox.checked = currentTarget.checked;
							callback.call(this, { currentTarget : thisInstance.previous_listViewEntriesCheckBox });
						}
								
					}
					jQuery('.listViewEntriesCheckBox').each( function(index,element) {
						if (!founded) { //search for first
							if (this === currentTarget) { //bottom to above
								thisInstance.previous_listViewEntriesCheckBox.checked = currentTarget.checked;
								callback.call(this, { currentTarget : thisInstance.previous_listViewEntriesCheckBox });
								currentTarget = thisInstance.previous_listViewEntriesCheckBox;
								founded = true;
							}
							else if (this === thisInstance.previous_listViewEntriesCheckBox) {
								founded = true;
							}
							return;
						}
						if (this === currentTarget) 
							return false; //the end
						this.checked = currentTarget.checked;
						callback.call(this, { currentTarget : this }); //manage each checkbox individualy
					
					});
				}
				thisInstance.previous_listViewEntriesCheckBox = e.currentTarget;
			}
			
			var selectedIds = thisInstance.readSelectedIds();
			var excludedIds = thisInstance.readExcludedIds();
			var elem = jQuery(e.currentTarget);
			if(elem.is(':checked')){
				elem.closest('tr').addClass('highlightBackgroundColor');
				if(selectedIds== 'all'){
					excludedIds.splice( jQuery.inArray(elem.val(), excludedIds), 1 );
				} else if((jQuery.inArray(elem.val(), selectedIds)) == -1) {
					selectedIds.push(elem.val());
				}
			} else {
				elem.closest('tr').removeClass('highlightBackgroundColor');
				if(selectedIds == 'all') {
					excludedIds.push(elem.val());
					selectedIds = 'all';
				} else {
					selectedIds.splice( jQuery.inArray(elem.val(), selectedIds), 1 );
				}
			}
			thisInstance.checkSelectAll();
			thisInstance.writeSelectedIds(selectedIds);
			thisInstance.writeExcludedIds(excludedIds);
		});
	},

	/*
	 * Function to register the click event for select all.
	 */
	registerSelectAllClickEvent :  function(){
		var listViewPageDiv = this.getListViewContainer();
		var thisInstance = this;
		listViewPageDiv.delegate('#selectAllMsg','click',function(){
			jQuery('#selectAllMsgDiv').hide();
			jQuery("#deSelectAllMsgDiv").show();
			jQuery('#listViewEntriesMainCheckBox').attr('checked',true);
			jQuery('.listViewEntriesCheckBox').each( function(index,element) {
				jQuery(this).attr('checked', true).closest('tr').addClass('highlightBackgroundColor');
			});
			thisInstance.writeSelectedIds('all');
		});
	},

	/*
	* Function to register the click event for deselect All.
	*/
	registerDeselectAllClickEvent : function(){
		var listViewPageDiv = this.getListViewContainer();
		var thisInstance = this;
		listViewPageDiv.delegate('#deSelectAllMsg','click',function(){
			jQuery('#deSelectAllMsgDiv').hide();
			jQuery('#listViewEntriesMainCheckBox').attr('checked',false);
			jQuery('.listViewEntriesCheckBox').each( function(index,element) {
				jQuery(this).attr('checked', false).closest('tr').removeClass('highlightBackgroundColor');
			});
			var excludedIds = new Array();
			var selectedIds = new Array();
			thisInstance.writeSelectedIds(selectedIds);
			thisInstance.writeExcludedIds(excludedIds);
		});
	},

	/*
	 * Function to register the click event for listView headers
	 */
	registerHeadersClickEvent :  function(){
		var listViewPageDiv = this.getListViewContainer();
		var thisInstance = this;
		listViewPageDiv.on('click','.listViewHeaderValues',function(e){
			var fieldName = jQuery(e.currentTarget).data('columnname');
			var sortOrderVal = jQuery(e.currentTarget).data('nextsortorderval');
			var cvId = thisInstance.getCurrentCvId();
			var urlParams = {
				"orderby": fieldName,
				"sortorder": sortOrderVal,
				"viewname" : cvId
			}
			thisInstance.getListViewRecords(urlParams);
		});
	},

	/*
	 * function to register the click event event for create filter
	 */
	registerCreateFilterClickEvent : function(){
		var thisInstance = this;
		jQuery('#createFilter').on('click',function(event){
			//to close the dropdown
			thisInstance.getFilterSelectElement().data('select2').close();
			var currentElement = jQuery(event.currentTarget);
			var createUrl = currentElement.data('createurl');
			Vtiger_CustomView_Js.loadFilterView(createUrl);
		});
	},

	/*
	 * Function to register the click event for edit filter
	 */
	registerEditFilterClickEvent : function(){
		var thisInstance = this;
		var listViewFilterBlock = this.getFilterBlock();
		if(listViewFilterBlock != false){
			listViewFilterBlock.on('mouseup','li i.editFilter',function(event){
				//to close the dropdown
				thisInstance.getFilterSelectElement().data('select2').close();
				var liElement = jQuery(event.currentTarget).closest('.select2-result-selectable');
				var currentOptionElement = thisInstance.getSelectOptionFromChosenOption(liElement);
				var editUrl = currentOptionElement.data('editurl');
				Vtiger_CustomView_Js.loadFilterView(editUrl);
				event.stopPropagation();
			});
		}
	},

	/* ED151104
	 * Function to register the click event for edit selected filter
	 * (petit crayon à côté de la liste des customviews)
	 */
	registerEditSelectedFilterClickEvent : function(){
		var thisInstance = this;
		var topMenu = this.getListViewTopMenuContainer();
		if(topMenu != false){
			topMenu.on('click','#customFilter-edit',function(event){
				//to close the dropdown
				var cvId = thisInstance.getCurrentCvId();
				var currentOptionElement = thisInstance.getFilterSelectElement().find('#filterOptionId_' + cvId);
				if (currentOptionElement.data('editable')) {
					var editUrl = currentOptionElement.data('editurl');
					Vtiger_CustomView_Js.loadFilterView(editUrl);
				}
				else{
					var message = "Cette vue n'est pas modifiable";//TODO translate
					Vtiger_Helper_Js.showMessage(message);					
				}
				event.stopPropagation();
				return false;
			});
		}
	},

	/*
	 * Function to register the click event for delete filter
	 */
	registerDeleteFilterClickEvent: function(){
		var thisInstance = this;
		var listViewFilterBlock = this.getFilterBlock();
		if(listViewFilterBlock != false){
			//used mouseup event to stop the propagation of customfilter select change event.
			listViewFilterBlock.on('mouseup','li i.deleteFilter',function(event){
				//to close the dropdown
				thisInstance.getFilterSelectElement().data('select2').close();
				var liElement = jQuery(event.currentTarget).closest('.select2-result-selectable');
				var message = app.vtranslate('JS_LBL_ARE_YOU_SURE_YOU_WANT_TO_DELETE');
				Vtiger_Helper_Js.showConfirmationBox({'message' : message}).then(
					function(e) {
						var currentOptionElement = thisInstance.getSelectOptionFromChosenOption(liElement);
						var deleteUrl = currentOptionElement.data('deleteurl');
						window.location.href = deleteUrl;
					},
					function(error, err){
					}
				);
				event.stopPropagation();
			});
		}
	},

	/*
	 * Function to register the click event for approve filter
	 */
	registerApproveFilterClickEvent: function(){
		var thisInstance = this;
		var listViewFilterBlock = this.getFilterBlock();

		if(listViewFilterBlock != false){
			listViewFilterBlock.on('mouseup','li i.approveFilter',function(event){
				//to close the dropdown
				thisInstance.getFilterSelectElement().data('select2').close();
				var liElement = jQuery(event.currentTarget).closest('.select2-result-selectable');
				var currentOptionElement = thisInstance.getSelectOptionFromChosenOption(liElement);
				var approveUrl = currentOptionElement.data('approveurl');
				window.location.href = approveUrl;
				event.stopPropagation();
			});
		}
	},

	/*
	 * Function to register the click event for deny filter
	 */
	registerDenyFilterClickEvent: function(){
		var thisInstance = this;
		var listViewFilterBlock = this.getFilterBlock();

		if(listViewFilterBlock != false){
			listViewFilterBlock.on('mouseup','li i.denyFilter',function(event){
				//to close the dropdown
				thisInstance.getFilterSelectElement().data('select2').close();
				var liElement = jQuery(event.currentTarget).closest('.select2-result-selectable');
				var currentOptionElement = thisInstance.getSelectOptionFromChosenOption(liElement);
				var denyUrl = currentOptionElement.data('denyurl');
				window.location.href = denyUrl;
				event.stopPropagation();
			});
		}
	},

	/*
	 * Function to register the hover event for customview filter options
	 */
	registerCustomFilterOptionsHoverEvent : function(){
		var thisInstance = this;
		var listViewTopMenuDiv = this.getListViewTopMenuContainer();
		var filterBlock = this.getFilterBlock()
		if(filterBlock != false){
			filterBlock.on('hover','li.select2-result-selectable',function(event){
				var liElement = jQuery(event.currentTarget);
				var liFilterImages = liElement.find('.filterActionImgs');
				if (liElement.hasClass('group-result')){
					return;
				}

				if( event.type === 'mouseenter' ) {
					if(liFilterImages.length > 0){
						liFilterImages.show();
					}else{
						thisInstance.performFilterImageActions(liElement);
					}

				} else {
					liFilterImages.hide();
				}
			});
		}
	},

	performFilterImageActions : function(liElement) {
		jQuery('.filterActionImages').clone(true,true).removeClass('filterActionImages').addClass('filterActionImgs').appendTo(liElement.find('.select2-result-label')).show();
		var currentOptionElement = this.getSelectOptionFromChosenOption(liElement);
		var deletable = currentOptionElement.data('deletable');
		if(deletable != '1'){
			liElement.find('.deleteFilter').remove();
		}
		var editable = currentOptionElement.data('editable');
		if(editable != '1'){
			liElement.find('.editFilter').remove();
		}
		var pending = currentOptionElement.data('pending');
		if(pending != '1'){
			liElement.find('.approveFilter').remove();
		}
		var approve = currentOptionElement.data('public');
		if(approve != '1'){
			liElement.find('.denyFilter').remove();
		}
	},

	/*
	 * Function to register the list view row click event
	 */
	registerRowClickEvent: function(){
		var thisInstance = this;
		var listViewContentDiv = this.getListViewContentContainer();
		listViewContentDiv.on('click','.listViewEntries',function(e){
			if(jQuery(e.target, jQuery(e.currentTarget)).is('td:first-child')) return;
			//ED151222 un click sur un <A/> est prioritaire
			if(jQuery(e.target, jQuery(e.currentTarget)).is('a[href]')) return;
			if(jQuery(e.target.parentNode, jQuery(e.currentTarget)).is('a[href]')) return;
			
			if(jQuery(e.target).is('input[type="checkbox"]')) return;
			var elem = jQuery(e.currentTarget);
			var recordUrl = elem.data('recordurl');
            if(typeof recordUrl == 'undefined') {
                return;
            }
			window.location.href = recordUrl;
		});
	},

	/*
	 * Function to register the list view delete record click event
	 */
	registerDeleteRecordClickEvent: function(){
		var thisInstance = this;
		var listViewContentDiv = this.getListViewContentContainer();
		listViewContentDiv.on('click','.deleteRecordButton',function(e){
			var elem = jQuery(e.currentTarget);
			var recordId = elem.closest('tr').data('id');
			Vtiger_List_Js.deleteRecord(recordId);
			e.stopPropagation();
		});
	},
	/*
	 * Function to register the click event of email field
	 */
	registerEmailFieldClickEvent : function(){
		var listViewContentDiv = this.getListViewContentContainer();
		listViewContentDiv.on('click','.emailField',function(e){
			e.stopPropagation();
		})
	},

	/*
	 * Function to register the click event of url field
	 */
	registerUrlFieldClickEvent : function(){
		var listViewContentDiv = this.getListViewContentContainer();
		listViewContentDiv.on('click','.urlField',function(e){
			e.stopPropagation();
		})
	},

	/**
	 * Function to inactive field for validation in a form
	 * this will remove data-validation-engine attr of all the elements
	 * @param Accepts form as a parameter
	 */
	inactiveFieldValidation : function(form){
        var massEditFieldList = jQuery('#massEditFieldsNameList').data('value');
		for(var fieldName in massEditFieldList){
            var fieldInfo = massEditFieldList[fieldName];

            var fieldElement = form.find('[name="'+fieldInfo.name+'"]');
            if(fieldInfo.type == "reference") {
                //get the element which will be shown which has "_display" appended to actual field name
                fieldElement = form.find('[name="'+fieldInfo.name+'_display"]');
            }else if(fieldInfo.type == "multipicklist") {
                fieldElement = form.find('[name="'+fieldInfo.name+'[]"]');
            }

            //Not all the fields will be enabled for mass edit
            if(fieldElement.length == 0 ) {
                continue;
            }

			var elemData = fieldElement.data();

            //Blank validation by default
            var validationVal = "validate[]"
            if('validationEngine' in elemData) {
                validationVal =  elemData.validationEngine;
                delete elemData.validationEngine;
            }
            fieldElement.data('invalidValidationEngine',validationVal);
			fieldElement.removeAttr('data-validation-engine');
		}
	},

	/**
	 * function to register field for validation
	 * this will add the data-validation-engine attr of all the elements
	 * make the field available for validation
	 * @param Accepts form as a parameter
	 */
	registerFieldsForValidation : function(form){
		form.find('.fieldValue').on('change','input,select,textarea',function(e, params){
			if(typeof params == 'undefined'){
				params = {};
			}

			if(typeof params.forceDeSelect == 'undefined') {
				params.forceDeSelect = false;
			}
			var element = jQuery(e.currentTarget);
			var fieldValue = element.val();
			var parentTd = element.closest('td');
			if(((fieldValue == "" || fieldValue == null) && (typeof(element.attr('data-validation-engine')) != "undefined")) || params.forceDeSelect){
				if(parentTd.hasClass('massEditActiveField')){
					parentTd.removeClass('massEditActiveField');
				}
				element.removeAttr('data-validation-engine');
				element.validationEngine('hide');
				var invalidFields = form.data('jqv').InvalidFields;
				var response = jQuery.inArray(element.get(0),invalidFields);
				if(response != '-1'){
					invalidFields.splice(response,1);
				}
			} else if((fieldValue != "") && (typeof(element.attr('data-validation-engine')) == "undefined")){
				element.attr('data-validation-engine', element.data('invalidValidationEngine'));
				parentTd.addClass('massEditActiveField');
			}
		})
	},

	registerEventForTabClick : function(form){
		var ulContainer = form.find('.massEditTabs');
		ulContainer.on('click','a[data-toggle="tab"]',function(e){
			form.validationEngine('validate');
			var invalidFields = form.data('jqv').InvalidFields;
			if(invalidFields.length > 0){
				e.stopPropagation();
			}
		});
	},

	registerReferenceFieldsForValidation : function(form){
		var referenceField = form.find('.sourceField');
		form.find('.sourceField').on(Vtiger_Edit_Js.referenceSelectionEvent,function(e,params){
			var element = jQuery(e.currentTarget);
			var elementName = element.attr('name');
			var fieldDisplayName = elementName+"_display";
			var fieldDisplayElement = form.find('input[name="'+fieldDisplayName+'"]');
			if(params.selectedName == ""){
				return;
			}
			fieldDisplayElement.attr('data-validation-engine', fieldDisplayElement.data('invalidValidationEngine'));
            var parentTd = fieldDisplayElement.closest('td');
            if(!parentTd.hasClass('massEditActiveField')){
                parentTd.addClass('massEditActiveField');
            }
		})
		form.find('.clearReferenceSelection').on(Vtiger_Edit_Js.referenceDeSelectionEvent,function(e){
			var sourceField = form.find('.sourceField');
			var sourceFieldName = sourceField.attr('name');
			var fieldDisplayName = sourceFieldName+"_display";
			var fieldDisplayElement = form.find('input[name="'+fieldDisplayName+'"]').removeAttr('data-validation-engine');
            var parentTd = fieldDisplayElement.closest('td');
            if(parentTd.hasClass('massEditActiveField')){
                parentTd.removeClass('massEditActiveField');
            }
		})
	},

	registerSlimScrollMassEdit : function() {
		app.showScrollBar(jQuery('div[name="massEditContent"]'), {'height':'400px'});
	},

	/*
	 * Function to register the submit event for mass Actions save
	 */
	registerMassActionSubmitEvent : function(){
        var thisInstance = this;
		jQuery('body').on('submit','#massSave',function(e){
			var form = jQuery(e.currentTarget);
			var commentContent = form.find('#commentcontent')
			var commentContentValue = commentContent.val();
			if(commentContentValue == "") {
				var errorMsg = app.vtranslate('JS_LBL_COMMENT_VALUE_CANT_BE_EMPTY')
				commentContent.validationEngine('showPrompt', errorMsg , 'error','bottomLeft',true);
				e.preventDefault();
				return;
			}
			commentContent.validationEngine('hide');
			thisInstance.massActionSave(form).then(function(data){
					Vtiger_List_Js.clearList();
			});
			e.preventDefault();
		});
	},

	changeCustomFilterElementView : function() {
		var filterSelectElement = this.getFilterSelectElement();
		if(filterSelectElement.length > 0 && filterSelectElement.is("select")) {
			app.showSelect2ElementView(filterSelectElement,{
				formatSelection : function(data, contianer){
					var resultContainer = jQuery('<span></span>');
					resultContainer.append(jQuery(jQuery('.filterImage').clone().get(0)).show());
					resultContainer.append(data.text);
					return resultContainer;
				},
				customSortOptGroup : true
			});

			var select2Instance = filterSelectElement.data('select2');
            jQuery('span.filterActionsDiv').appendTo(select2Instance.dropdown).removeClass('hide');
		}
	},

	triggerDisplayTypeEvent : function() {
		var widthType = app.cacheGet('widthType', 'narrowWidthType');
		if(widthType) {
			var elements = jQuery('.listViewEntriesTable').find('td,th');
			elements.attr('class', widthType);
		}
	},

	registerEventForAlphabetSearch : function() {
		var thisInstance = this;
		var listViewPageDiv = this.getListViewContentContainer();
		listViewPageDiv.on('click','.alphabetSearch',function(e) {
			var $target = jQuery(e.currentTarget);
			var $alphabet = $target.find('a');
			var alphabet = $alphabet.attr('data-searchvalue') !== undefined ? $alphabet.attr('data-searchvalue') : $target.find('a').text();
			var alphabetInput = $alphabet.attr('data-searchinput') !== undefined ? $alphabet.attr('data-searchinput') : alphabet;
			var cvId = thisInstance.getCurrentCvId();
			/* ED150903 defined search key in one ancestor */
			var $container = $target.parents('.alphabetSorting[data-searchkey]');
			var specificSearchKey = $container.attr('data-searchkey');
			var specificSearchOperator = $alphabet.attr('data-searchoperator');
			if(!specificSearchOperator)
				specificSearchOperator = $container.attr('data-searchoperator');
			var alphabetSearchKey = specificSearchKey ? specificSearchKey : thisInstance.getAlphabetSearchField();
			
			//ED150903 this search complete header filters
			var urlParams = thisInstance.getHeadersFiltersUrlParams(e, {
				"viewname" : cvId,
				"search_key" : [],
				"search_value" : [],
				"search_input" : [],
				"operator" : [],
				"page"	:	1
			});
			var addKey = true;
			for(i = 0; i < urlParams.search_key.length; i++)
				if(urlParams.search_key[i] == alphabetSearchKey){
					addKey = false;
					urlParams.search_value[i] = alphabet;
					urlParams.search_input[i] = alphabetInput;
					urlParams.operator[i] = specificSearchOperator ? specificSearchOperator : 's';
					break;
				}
			if (addKey) {
				urlParams.search_key.push( alphabetSearchKey );
				urlParams.search_value.push( alphabet );
				urlParams.search_input.push( alphabetInput );
				urlParams.operator.push( specificSearchOperator ? specificSearchOperator : 's' );
			}
			
			jQuery('#recordsCount').val('');
			//To Set the page number as first page
			jQuery('#pageNumber').val('1');
			jQuery('#pageToJump').val('1');
			jQuery('#totalPageCount').text("");
			thisInstance.getListViewRecords(urlParams).then(
					function(data){
						thisInstance.updatePagination();
                        //To unmark the all the selected ids
                        jQuery('#deSelectAllMsg').trigger('click');
					},

					function(textStatus, errorThrown){
					}
			);
		});
	},

	/**
	 * Function to show total records count in listview on hover
	 * of pageNumber text
	 */
	registerEventForTotalRecordsCount : function(){
		var thisInstance = this;
		jQuery('.pageNumbers').on('mouseenter',function(e){
			var element = jQuery(e.currentTarget);
			var totalRecordsElement = jQuery('#totalCount');
			var totalNumberOfRecords = totalRecordsElement.val();
			if(totalNumberOfRecords == '') {
				thisInstance.getPageCount().then(function(data){
					totalNumberOfRecords = data['result']['numberOfRecords'];
					totalRecordsElement.val(totalNumberOfRecords);
				});
			}
			if(totalNumberOfRecords != ''){
				var titleWithRecords = app.vtranslate("JS_TOTAL_RECORDS")+" "+totalNumberOfRecords;
				element.data('tooltip').options.title = titleWithRecords;
				return false;
			} else {
				element.data('tooltip').options.title = "";
			}
		})
	},
	
	registerEvents : function(){

		this.registerRowClickEvent();
		this.registerPageNavigationEvents();
		this.registerMainCheckBoxClickEvent();
		this.registerCheckBoxClickEvent();
		this.registerSelectAllClickEvent();
		this.registerDeselectAllClickEvent();
		this.registerDeleteRecordClickEvent();
		this.registerHeadersClickEvent();
		this.registerMassActionSubmitEvent();
		this.registerEventForAlphabetSearch();

		this.changeCustomFilterElementView();
		this.registerChangeCustomFilterEvent();
		this.registerCreateFilterClickEvent();
		this.registerEditFilterClickEvent();
		this.registerEditSelectedFilterClickEvent();//ED151104
		this.registerDeleteFilterClickEvent();
		this.registerApproveFilterClickEvent();
		this.registerDenyFilterClickEvent();
		this.registerCustomFilterOptionsHoverEvent();
		this.registerEmailFieldClickEvent();
		//this.triggerDisplayTypeEvent();
		Vtiger_Helper_Js.showHorizontalTopScrollBar();
		this.registerUrlFieldClickEvent();
		this.registerEventForTotalRecordsCount();
		jQuery('.pageNumbers').tooltip();
		
		/* ED150412 */
		this.registerEventForHeaderFilterChange();

		//Just reset all the checkboxes on page load: added for chrome issue.
		var listViewContainer = this.getListViewContentContainer();
		listViewContainer.find('#listViewEntriesMainCheckBox,.listViewEntriesCheckBox').prop('checked', false);
	},

	/**
	 * Function that executes after the mass delete action
	 */
	postMassDeleteRecords : function() {
		var aDeferred = jQuery.Deferred();
		var listInstance = Vtiger_List_Js.getInstance();
		app.hideModalWindow();
		var module = app.getModuleName();
		var params = listInstance.getDefaultParams();
		AppConnector.request(params).then(
			function(data) {
				jQuery('#recordsCount').val('');
				jQuery('#totalPageCount').text('');
				var listViewContainer = listInstance.getListViewContentContainer();
				listViewContainer.html(data);
				//listInstance.triggerDisplayTypeEvent();
				jQuery('#deSelectAllMsg').trigger('click');
				listInstance.calculatePages().then(function(){
					listInstance.updatePagination();
				});
				aDeferred.resolve();
		});
		jQuery('#recordsCount').val('');
		return aDeferred.promise();
	},
	
	

//	/* ED150412
//	 * Function to create the filters row after listView headers
//	 * //TODO css
//	 */
//	createHeadersFilters :  function(){
//		var listViewPageDiv = this.getListViewContainer()
//		, thisInstance = this
//		, $listViewPageDiv = listViewPageDiv.find('tr.listViewHeaders')
//		, $listViewHeardersFilter = $listViewPageDiv.clone()
//			.insertAfter($listViewPageDiv)
//			.addClass('listViewHeaders-filters')
//			/*.css({
//				'padding': '0',
//				'line-height': '1em'
//			})*/
//			.find('th').empty().end()
//			.find('th:gt(1)').each(function(){
//				$(this)	
//					/*.css({
//						'padding': '0',
//						'line-height': '1em'
//					})*/
//					.html(thisInstance.makeHeaderFilterInput(this)
//						.css({
//							'max-width': '5em',
//							'padding': '0 3px',
//							'margin-bottom': '0',
//							'opacity': '0.7'
//						})
//						.change(thisInstance.headerFilterChangedListener)
//					)
//				;
//			}).end()
//		;
//		$listViewPageDiv
//			//TODO css
//			.find('th').attr('style', 'padding-top: 0px !important; padding-bottom: 0px !important;').end()
//		;
//	},
//	
//	makeHeaderFilterInput :  function($th){
//		if (!$th.jquery)
//			$th = $($th);
//		return $('<input/>');
//	},
//	
//	headerFilterChangedListener :  function(){
//		
//		//listViewPageDiv.on('click','.alphabetSearch',function(e) {
//			var alphabet = jQuery(e.currentTarget).find('a').text();
//			var cvId = thisInstance.getCurrentCvId();
//			var AlphabetSearchKey = thisInstance.getAlphabetSearchField();
//			var urlParams = {
//				"viewname" : cvId,
//				"search_key" : AlphabetSearchKey,
//				"search_value" : alphabet,
//				"operator" : 's',
//				"page"	:	1
//			}
//			jQuery('#recordsCount').val('');
//			//To Set the page number as first page
//			jQuery('#pageNumber').val('1');
//			jQuery('#pageToJump').val('1');
//			jQuery('#totalPageCount').text("");
//			thisInstance.getListViewRecords(urlParams).then(
//					function(data){
//						thisInstance.updatePagination();
//                        //To unmark the all the selected ids
//                        jQuery('#deSelectAllMsg').trigger('click');
//					},
//
//					function(textStatus, errorThrown){
//					}
//			);
//		//});
//	},

	//ED151009 to be overrided
	requestViewClass : 'List',
	
	/* ED150412
	 * Function to register change in header filter inputs
	 */
	registerEventForHeaderFilterChange : function() {
		var thisInstance = this;
		var listViewPageDiv = this.getListViewContentContainer();
		listViewPageDiv.on('hover','.listViewHeaders.filters', thisInstance.onHeaderFilterHOverEvent);
		listViewPageDiv.on('focus','.listViewHeaders.filters :input', thisInstance.onHeaderFilterFocusEvent);
		listViewPageDiv.on('change','.listViewHeaders.filters :input',function(e) {
			
			var cvId = thisInstance.getCurrentCvId();
			var urlParams = thisInstance.getHeadersFiltersUrlParams(e, {
				"viewname" : cvId,
				"search_key" : [],
				"search_value" : [],
				"search_input" : [],
				"operator" : [],
				"page"	:	1
			});
			jQuery('#recordsCount').val('');
			//To Set the page number as first page
			jQuery('#pageNumber').val('1');
			jQuery('#pageToJump').val('1');
			jQuery('#totalPageCount').text("");
			
			thisInstance.setHeaderFilterLastFocus(false);//reset
			
			thisInstance.getListViewRecords(urlParams).then(
				function(data){
					thisInstance.updatePagination();
					//To unmark the all the selected ids
					jQuery('#deSelectAllMsg').trigger('click');
					
					thisInstance.focusHeaderFilterLastFocus();
				},

				function(textStatus, errorThrown){}
			);
		});
	},
	/** ED151201
	 * Gestion du focus sur les input
	 * Permet de rétablir le focus après un rechargement de listview.
	 * Contexte :
	 * L'utilisateur saisit un texte dans l'en-tête de colonne Nom, clique dans Prénom pour faire un second filtre
	 * , sauf qu'après la sortie du nom la recherche se lance et recharge la liste, en perdant le focus sur Prénom.
	 */
	//Mémorise le dernier focus sur un input
	onHeaderFilterFocusEvent : function(e){
		var $focus = $(this);
		if ($focus.attr('id')) {
			$focus = '#' + $focus.attr('id');
		}
		else
			$focus = '.' + $focus.attr('class').replace(' ', '.');
		var listInstance = Vtiger_List_Js.getInstance();
		listInstance.setHeaderFilterLastFocus($focus);
	},
	//Stocke la réfénce du dernier input ayant reçu le focus
	setHeaderFilterLastFocus : function($focus){
		$(document.body).data('input:focused', $focus);
	},
	//Focus sur l'input mémorisé
	focusHeaderFilterLastFocus : function(){
		var $focus = $(document.body).data('input:focused');
		if ($focus) {
			$($focus).focus();
		}
	},
	
	/* ED150412
	 * Function to add header filter toolbox
	 */
	onHeaderFilterHOverEvent : function(e){
		var $th = $(this).children('th:first')
		, $actions = $th.children('.actionImages');
		if ($actions.length === 0) {
			$('<span class="actionImages"></span>')
				.append($('<a href class="icon-refresh" title="'+app.vtranslate('JS_REFRESH')+'"></a>')
					.css({ float: 'right', 'opacity': '0.7', 'margin-right': '4px'})
					.click(function(){
						//TODO do not use url parameters that contains search_key and search_value
						$(this).parents('tr:first').find(':input:visible:first').change();//TODO function
						return false;
					})
				)
				.append($('<a href class="icon-remove-sign" title="'+app.vtranslate('JS_RESET_FILTERS')+'"></a>')
					.css({ float: 'right', 'opacity': '0.7', 'margin-right': '4px'})
					.click(function(){
						$(this).parents('th:first').nextAll('th').find(':input:visible').val('');
						return false;
					})
				)
				.append($('<a href class="icon-question-sign" title="'+app.vtranslate('JS_HELP')+'"></a>')
					.css({ float: 'right', 'opacity': '0.7', 'margin-right': '4px'})
					.click(function(){
						Vtiger_Helper_Js.showFAQRecord('FAQ4'); //TODO transposer le code faq_no dans un ficher de config js
						return false;
					})
				)
				.appendTo($th)
			;
		}
	},
	
	/* ED150412
	 * Function to register change in header filter inputs
	 */
	getHeadersFiltersUrlParams : function(e, urlParams) {
		var $filtersRow = jQuery(e.currentTarget).parents('.listViewHeaders.filters:first');
		if ($filtersRow.length === 0)
			$filtersRow = jQuery(e.currentTarget).parents('.listViewPageDiv').find('.listViewHeaders.filters:first');
		
		$filtersRow.find(':input[data-field-name]').each(function(){
			var $input = jQuery(this)
			//, $th = $input.parents('th:first')
			, searchInput = $input.val()//TODO Checkbox : On click event + e.currentTarget.checked
			, searchValue = searchInput
			if (searchValue == ''
			|| ($input[0].tagName == 'SELECT') && searchValue == ' ')
				return;
			var searchType = $input.attr('data-field-type')
			, searchKey = $input.attr('data-field-name')
			, operator = /^\s*([\^\=\>\<\!\%]+|\%\-|[\!N]?IN\s|[\!N]?PARMIS\s)\s*(.*)$/i.exec(searchValue);
			if (operator === null) {
				operator = $input.attr('data-operator');
			}
			//ED150605 : select text is translated value
			else if(operator
			&& (operator[1].trim() //--> La liste Contacts.IsGroup fournit un filtre '<>0'
			|| $input[0].tagName != 'SELECT')
			) {  
				searchValue = operator[2];
				operator = operator[1].trim().toUpperCase();
			}
			if (operator != null) {
				//see include\QueryGenerator\QueryGenerator.php : line 1051
				switch(operator){
				 case '^' :
					operator = 's';
					break;
				 case '=' :
					operator = 'e';
					break;
				 case '!' :
				 case '<>' :
					operator = searchValue.substr('%') < 0 ? 'n' : 'k';
					break;
				 case '!%' :
				 case '<>%' :
					operator = 'k';
					break;
				 case '>' :
					operator = 'g';
					break;
				 case '>=' :
					operator = 'h';
					break;
				 case '<' :
					operator = 'l';
					break;
				 case '<=' :
					operator = 'm';
					break;
				 case '%' : // like % %
					operator = 'c';
					break;
				 case '%-' : // ends with
					operator = 'ew';
					break;
				 case 'IN' :
				 case 'PARMIS' :
					operator = 'vwi';
					break;
				 case 'NIN' :
				 case 'NPARMIS' :
				 case '!PARMIS' :
					operator = 'vwx';
					break;
				}
			}
			else {
				//ED151201 : Default operator 'Contains'
				switch (searchType) {
				 case 'date':
					operator = 'e';
					break;
				 case 'numeric':
				 case 'integer':
				 case 'currency':
				 case 'double':
					operator = 'h';
					break;
				 default:
					operator = 'c';
				}
			}
			if (operator == 's') 
				switch (searchType) {
				 case 'date':
					operator = 'e';
					break;
				 case 'numeric':
				 case 'integer':
				 case 'currency':
				 case 'double':
					operator = 'h';
					break;
				 case 'multipicklist' :
					operator = 'c';
					break;
				 default:
					break;
				}
			urlParams.search_key.push(searchKey);
			urlParams.search_value.push(searchValue);
			urlParams.search_input.push(searchInput);
			urlParams.operator.push(operator);
		});
		return urlParams;
	}
});